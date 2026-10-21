import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Faltan variables de entorno para inicializar Firebase Admin.");
    }

    // Contemplar saltos de línea escapados en la clave privada
    privateKey = privateKey.replace(/\\n/g, "\n");

    return initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

function getSESClient(): { client: SESClient; fromEmail: string } {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const fromEmail = process.env.SES_FROM_EMAIL;

    if (!region || !accessKeyId || !secretAccessKey || !fromEmail) {
        throw new Error("Faltan variables de entorno para configurar AWS SES.");
    }

    const client = new SESClient({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    return { client, fromEmail };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido. Utilizá POST." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token de autorización faltante o con formato inválido." });
    }

    const idToken = authHeader.substring(7).trim();
    if (!idToken) {
        return res.status(401).json({ error: "Token de autorización vacío." });
    }

    let stage = "firebase-init";

    try {
        const adminApp = getFirebaseAdminApp();
        const authAdmin = getAuth(adminApp);
        const dbAdmin = getFirestore(adminApp);

        // 4. Verificación del ID token en el servidor
        stage = "firebase-token";
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const recipientEmail = decodedToken.email;

        // 5. Validación del correo del destinatario obtenido del token
        if (!recipientEmail) {
            return res.status(400).json({
                error: "El usuario autenticado no posee una dirección de correo electrónico asociada.",
            });
        }

        // 6. Consulta en Firestore filtrando exclusivamente por el UID verificado
        stage = "firestore-read";
        const tasksSnapshot = await dbAdmin
            .collection("tasks")
            .where("userId", "==", uid)
            .get();

        const tasks: Array<{ title: string; completed: boolean; description?: string }> = [];
        tasksSnapshot.forEach((doc) => {
            const data = doc.data();
            tasks.push({
                title: (data.title as string) || "Sin título",
                completed: Boolean(data.completed),
                description: (data.description as string) || "",
            });
        });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        // 8. Construcción del resumen en texto plano con UTF-8
        let summaryBody = `Hola,\n\n`;
        summaryBody += `Este es el resumen actualizado de tus tareas:\n\n`;
        summaryBody += `• Total de tareas: ${totalTasks}\n`;
        summaryBody += `• Tareas pendientes: ${pendingTasks}\n`;
        summaryBody += `• Tareas completadas: ${completedTasks}\n\n`;
        summaryBody += `Detalle de tareas:\n`;
        summaryBody += `--------------------------------------------------\n`;

        if (tasks.length === 0) {
            summaryBody += `No tenés tareas registradas actualmente.\n`;
        } else {
            tasks.forEach((task, index) => {
                const status = task.completed ? "[Completada]" : "[Pendiente]";
                summaryBody += `${index + 1}. ${status} ${task.title}\n`;
                if (task.description) {
                    summaryBody += `   Descripción: ${task.description}\n`;
                }
            });
        }

        summaryBody += `--------------------------------------------------\n\n`;
        summaryBody += `Saludos,\nProyecto Integrador M4`;

        // 7. Envío del resumen mediante AWS SES
        stage = "ses-config";
        const { client: sesClient, fromEmail } = getSESClient();

        const sendEmailCommand = new SendEmailCommand({
            Source: fromEmail,
            Destination: {
                ToAddresses: [recipientEmail],
            },
            Message: {
                Subject: {
                    Charset: "UTF-8",
                    Data: "Resumen de tus tareas",
                },
                Body: {
                    Text: {
                        Charset: "UTF-8",
                        Data: summaryBody,
                    },
                },
            },
        });

        stage = "ses-send";
        await sesClient.send(sendEmailCommand);

        return res.status(200).json({
            message: `Resumen enviado con éxito a ${recipientEmail}.`,
        });
    } catch (error: unknown) {
        // Registrar únicamente códigos conocidos, sin mensajes ni objetos con datos privados.
        const knownCodes = new Set([
            "MessageRejected", "AccessDenied", "AccessDeniedException",
            "InvalidClientTokenId", "SignatureDoesNotMatch", "InvalidSignatureException",
            "AccountSendingPausedException", "MailFromDomainNotVerifiedException",
            "Throttling", "ThrottlingException", "CredentialsProviderError",
            "auth/invalid-credential", "auth/invalid-id-token", "auth/id-token-expired",
            "auth/argument-error", "app/invalid-credential", "ENOTFOUND", "ETIMEDOUT",
            "UNAUTHENTICATED", "PERMISSION_DENIED", "UNAVAILABLE",
        ]);
        let diagnostic = "unknown";
        if (typeof error === "object" && error !== null) {
            for (const field of ["code", "name"] as const) {
                if (field in error) {
                    const value = (error as Record<string, unknown>)[field];
                    if (typeof value === "string" && knownCodes.has(value)) diagnostic = value;
                    if (field === "code" && typeof value === "number" && [7, 14, 16].includes(value)) {
                        diagnostic = `grpc-${value}`;
                    }
                }
            }
        }
        console.error("Email summary failure", { stage, code: diagnostic });

        // Manejo de token inválido o expirado
        if (typeof error === "object" && error !== null && "code" in error) {
            const fbError = error as { code: string; message: string };
            if (
                typeof fbError.code === "string" && (
                fbError.code === "auth/id-token-expired" ||
                fbError.code === "auth/argument-error" ||
                fbError.code.startsWith("auth/")
                )
            ) {
                return res.status(401).json({
                    error: "Sesión inválida o expirada. Por favor, volvé a iniciar sesión.",
                });
            }
        }

        // Error de configuración sin exponer credenciales
        if (error instanceof Error && error.message.includes("Faltan variables de entorno")) {
            console.error("Configuración incompleta en el servidor:", error.message);
            return res.status(500).json({
                error: "El servicio de correo no está configurado adecuadamente en el servidor.",
            });
        }

        // No registrar el objeto del error: puede contener datos de la solicitud.
        console.error("Falló el envío del resumen por email.");
        return res.status(500).json({
            error: "Ocurrió un error al procesar el envío del correo electrónico. Por favor, intentá nuevamente.",
        });
    }
}
