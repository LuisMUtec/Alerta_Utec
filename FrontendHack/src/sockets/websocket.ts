let socket: WebSocket | null = null;

/**
 * Conectar al WebSocket de AWS API Gateway
 * @param onMessageCallback - Callback que se ejecuta cuando llega un mensaje
 */
export function connectWebSocket(onMessageCallback: (data: unknown) => void): void {
  const WS_URL = import.meta.env.VITE_WS_URL;

  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log("WebSocket ya está conectado");
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("✅ WebSocket conectado exitosamente");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📨 Mensaje recibido:", data);
      onMessageCallback(data);
    } catch (error) {
      console.error("Error al procesar mensaje WebSocket:", error);
    }
  };

  socket.onclose = () => {
    console.log("❌ WebSocket desconectado");
    // Intentar reconectar después de 3 segundos
    setTimeout(() => {
      console.log("🔄 Intentando reconectar...");
      connectWebSocket(onMessageCallback);
    }, 3000);
  };

  socket.onerror = (error) => {
    console.error("⚠️ Error en WebSocket:", error);
  };
}

/**
 * Enviar un mensaje a través del WebSocket
 * @param message - Mensaje a enviar
 */
export function sendMessage(message: unknown): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    console.log("📤 Mensaje enviado:", message);
  } else {
    console.warn("WebSocket no está conectado. Estado:", socket?.readyState);
  }
}

/**
 * Desconectar el WebSocket
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
    console.log("WebSocket desconectado manualmente");
  }
}

/**
 * Verificar si el WebSocket está conectado
 */
export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}
