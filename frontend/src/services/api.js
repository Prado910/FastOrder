const API_BASE_URL = "http://localhost:8000/api";

// Procesa la respuesta HTTP y extrae un mensaje entendible si ocurre un error
async function handleResponse(response) {
    if (!response.ok) {
        let message = "Ocurrió un error en la petición";
        try {
            const errorData = await response.json();
            message = errorData.detail || message;
        } catch {
            // Si la respuesta no viene en JSON, se deja el mensaje por defecto
        }
        throw new Error(message);
    }

    return response.json();
}

// Obtiene todas las mesas (sin filtrar por estado)
export async function getMesas() {
    const response = await fetch(`${API_BASE_URL}/mesas`);
    return handleResponse(response);
}

// Obtiene las mesas disponibles para asignar un pedido
export async function getMesasDisponibles() {
    const response = await fetch(`${API_BASE_URL}/mesas/disponibles`);
    return handleResponse(response);
}

// Obtiene las mesas disponibles para asignar un pedido
export async function getProductos() {
    const response = await fetch(`${API_BASE_URL}/productos`);
    return handleResponse(response);
}

// Envía al backend la información necesaria para registrar un pedido
export async function crearPedido(payload) {
    const response = await fetch(`${API_BASE_URL}/pedidos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
}
