import { Server } from "socket.io";

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:3000", // Update this with your frontend URL
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Handle joining order tracking room
        socket.on("join_order_tracking", (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(
                `Client ${socket.id} joined order tracking room for order ${orderId}`
            );
        });

        // Handle order status updates
        socket.on("update_order_status", ({ orderId, status, position }) => {
            io.to(`order_${orderId}`).emit("order_status_updated", {
                orderId,
                status,
                position,
            });
            console.log(`Order ${orderId} status updated to ${status}`);
        });

        // Handle delivery position updates
        socket.on("update_delivery_position", ({ orderId, position }) => {
            io.to(`order_${orderId}`).emit("delivery_position_updated", {
                orderId,
                position,
            });
            console.log(`Order ${orderId} position updated:`, position);
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    return io;
};

// Utility function to emit order updates
export const emitOrderUpdate = (orderId, updateData) => {
    if (io) {
        io.to(`order_${orderId}`).emit("order_update", updateData);
    }
};
