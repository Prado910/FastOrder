const API_BASE_URL = "/api";

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

// Obtiene todas las mesas
export async function getMesas() {
    const response = await fetch(`${API_BASE_URL}/mesas`);
    return handleResponse(response);
}

// Obtiene las mesas disponibles para asignar un pedido
export async function getMesasDisponibles() {
    const response = await fetch(`${API_BASE_URL}/mesas/disponibles`);
    return handleResponse(response);
}

// Obtiene los productos visibles en el menú
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

export async function getPedidos({ criterio = "" } = {}) {
    const params = new URLSearchParams();

    if (criterio.trim()) {
        params.append("criterio", criterio.trim());
    }

    const queryString = params.toString();
    const url = queryString
        ? `${API_BASE_URL}/pedidos?${queryString}`
        : `${API_BASE_URL}/pedidos`;

    const response = await fetch(url);
    return handleResponse(response);
}

export async function getPedidosAdmin({
    criterio = "",
    estado = "TODOS",
    fechaDesde = "",
    fechaHasta = "",
} = {}) {
    const params = new URLSearchParams();

    if (criterio.trim()) {
        params.append("criterio", criterio.trim());
    }

    if (estado && estado !== "TODOS") {
        params.append("estado", estado);
    }

    if (fechaDesde) {
        params.append("fecha_desde", fechaDesde);
    }

    if (fechaHasta) {
        params.append("fecha_hasta", fechaHasta);
    }

    const queryString = params.toString();
    const url = queryString
        ? `${API_BASE_URL}/pedidos/admin?${queryString}`
        : `${API_BASE_URL}/pedidos/admin`;

    const response = await fetch(url);
    return handleResponse(response);
}

export async function consultarPedido(idPedido) {
    const response = await fetch(`${API_BASE_URL}/pedidos/${idPedido}`);
    return handleResponse(response);
}

export async function eliminarPedido(idPedido) {
    if (!idPedido) {
        throw new Error("Debe seleccionar un pedido válido para eliminar");
    }

    const response = await fetch(`${API_BASE_URL}/pedidos/${idPedido}`, {
        method: "DELETE",
    });

    return handleResponse(response);
}

export async function login(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
}

export async function getPedidosCocina() {
    const response = await fetch(`${API_BASE_URL}/pedidos/cocina`);
    return handleResponse(response);
}

export async function actualizarEstadoPedido(idPedido, estado) {
    if (!idPedido) {
        throw new Error("Debe seleccionar un pedido para consultar el detalle");
    }

    const response = await fetch(`${API_BASE_URL}/pedidos/${idPedido}/estado`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado }),
    });

    return handleResponse(response);
}

export async function getPedidosCaja({ criterio = "" } = {}) {
    const params = new URLSearchParams();

    if (criterio.trim()) {
        params.append("criterio", criterio.trim());
    }

    const queryString = params.toString();
    const url = queryString
        ? `${API_BASE_URL}/pedidos/caja?${queryString}`
        : `${API_BASE_URL}/pedidos/caja`;

    const response = await fetch(url);
    return handleResponse(response);
}

export async function crearFactura(payload) {
    const response = await fetch(`${API_BASE_URL}/facturas`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
}

export async function getFacturas() {
    const response = await fetch(`${API_BASE_URL}/facturas`);
    return handleResponse(response);
}