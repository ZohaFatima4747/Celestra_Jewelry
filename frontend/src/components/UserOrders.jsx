import React, { useEffect, useState } from "react";
import "./UserOrder.css";

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false); // loader state

  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const userId = getUserId();
      if (!userId) return;

      setLoading(true);
      try {
        const res = await fetch(`http://localhost:1000/api/orders/user/${userId}`);
        const data = await res.json();
        setOrders(data);
        setFilteredOrders(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const cancelOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:1000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage(data.error || "Cannot cancel this order");
        return;
      }

      const updatedOrders = orders.map((o) =>
        o._id === orderId ? { ...o, status: "cancelled" } : o
      );
      setOrders(updatedOrders);
      applyFilter(activeFilter, updatedOrders);
      setMessage("Order cancelled successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Error cancelling order.");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const applyFilter = (status, list = orders) => {
    setActiveFilter(status);
    if (status === "all") {
      setFilteredOrders(list);
    } else {
      setFilteredOrders(list.filter((order) => order.status === status));
    }
  };

  return (
    <div className="user-orders-container">
      <h3>Your Orders</h3>
      {message && <div className="order-message">{message}</div>}

      <div className="order-filters">
        {["all", "pending COD", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${activeFilter === status ? "active" : ""}`}
            onClick={() => applyFilter(status)}
          >
            {status === "all"
              ? "All"
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        <table border="1" width="100%">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Total</th>
              <th>Status</th>
              <th>Items</th>
              <th>Cancel</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              let badgeColor = "";
              switch (order.status) {
                case "pending COD":
                  badgeColor = "yellow";
                  break;
                case "completed":
                  badgeColor = "green";
                  break;
                case "cancelled":
                  badgeColor = "red";
                  break;
                default:
                  badgeColor = "gray";
              }

              return (
                <tr key={order._id}>
                  <td data-label="Order ID">{order._id}</td>
                  <td data-label="Total">Rs {order.total}</td>
                  <td data-label="Status">
                    <span className={`status-badge ${badgeColor}`}>
                      {order.status}
                    </span>
                  </td>
                  <td data-label="Items">{order.items.length}</td>
                  <td data-label="Cancel">
                    {order.status === "pending COD" ? (
                      <button
                        className="order-cancel-btn"
                        onClick={() => cancelOrder(order._id)}
                      >
                        Cancel
                      </button>
                    ) : (
                      <span style={{ color: "#999" }}>—</span>
                    )}
                  </td>
                  <td data-label="Receipt">
                    {order.receiptUrl ? (
                      <a
                        href={order.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="receipt-btn">View Receipt</button>
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserOrders;
