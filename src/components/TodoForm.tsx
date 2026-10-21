import { useState, useId } from "react";
import { FirebaseError } from "firebase/app";

interface TodoFormProps {
    onSubmit: (title: string, description: string) => Promise<boolean>;
    initialTitle?: string;
    initialDescription?: string;
    isEditing?: boolean;
    onCancel?: () => void;
    submitButtonText?: string;
}

export function TodoForm({
    onSubmit,
    initialTitle = "",
    initialDescription = "",
    isEditing = false,
    onCancel,
    submitButtonText,
}: TodoFormProps) {
    const [title, setTitle] = useState<string>(initialTitle);
    const [description, setDescription] = useState<string>(initialDescription);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);

    const titleId = useId();
    const descriptionId = useId();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setFormError("El título es obligatorio.");
            return;
        }
        if (trimmedTitle.length > 120) {
            setFormError("El título no puede superar los 120 caracteres.");
            return;
        }
        if (description.length > 2000) {
            setFormError("La descripción no puede superar los 2000 caracteres.");
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const success = await onSubmit(trimmedTitle, description.trim());
            if (success && !isEditing) {
                // Limpiamos los campos únicamente si la creación fue exitosa
                setTitle("");
                setDescription("");
            }
        } catch (error) {
            // Si falla, conservamos los datos ingresados en el formulario
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "firestore/permission-denied":
                        setFormError("No tenés permisos suficientes para realizar esta operación.");
                        break;
                    case "unavailable":
                    case "firestore/unavailable":
                    case "network-request-failed":
                        setFormError("El servicio no está disponible en este momento. Verificá tu conexión a internet.");
                        break;
                    default:
                        setFormError("Ocurrió un error al guardar la tarea. Por favor, intentá nuevamente.");
                        break;
                }
            } else if (error instanceof Error) {
                // Conservamos los mensajes propios de validación u otros errores lanzados
                setFormError(error.message);
            } else {
                setFormError("Ocurrió un error inesperado al guardar la tarea.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "16px",
                margin: "16px 0",
                textAlign: "left",
            }}
        >
            <h3 style={{ marginTop: 0 }}>
                {isEditing ? "Editar tarea" : "Nueva tarea"}
            </h3>

            <div style={{ marginBottom: "12px" }}>
                <label
                    htmlFor={titleId}
                    style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}
                >
                    Título * (1-120 caracteres)
                </label>
                <input
                    id={titleId}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    disabled={isSubmitting}
                    required
                    placeholder="Ej. Realizar entregable del módulo 4"
                    style={{
                        width: "100%",
                        padding: "8px",
                        boxSizing: "border-box",
                        borderRadius: "4px",
                        border: "1px solid var(--border)",
                    }}
                />
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label
                    htmlFor={descriptionId}
                    style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}
                >
                    Descripción (opcional, máx. 2000 caracteres)
                </label>
                <textarea
                    id={descriptionId}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    disabled={isSubmitting}
                    rows={3}
                    placeholder="Detalles sobre la tarea..."
                    style={{
                        width: "100%",
                        padding: "8px",
                        boxSizing: "border-box",
                        borderRadius: "4px",
                        border: "1px solid var(--border)",
                        resize: "vertical",
                    }}
                />
            </div>

            {formError && (
                <p role="alert" style={{ color: "#d9534f", marginBottom: "12px" }}>
                    {formError}
                </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? "Guardando..."
                        : submitButtonText ?? (isEditing ? "Guardar cambios" : "Agregar tarea")}
                </button>

                {isEditing && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
}

export default TodoForm;
