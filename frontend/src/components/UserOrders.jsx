import { useEffect, useState } from "react";
import { getUserId, getUserEmail } from "../utils/auth";
import { ORDER_URL } from "../utils/api";
import "./UserOrder.css";

const UserOrders = () => {
  const [orders, setOrders]               = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [message, setMessage]             = useState("");
  const [activeFilter, setActiveFilter]   = useState("all");
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      const userId = getUserId();
      if (!userId) return;
      setLoading(true);
      try {
        const email = getUserEmail();
        const url   = email
          ? `${ORDER_URL}/user/${userId}?email=${encodeURIComponent(email)}`
          : `${ORDER_URL}/user/${userId}`;
        const res  = await fetch(url);
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
      const res  = await fetch(`${ORDER_URL}/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!data.success) { setMessage(data.error || "Cannot cancel this order"); return; }
      const updated = orders.map((o) => o._id === orderId ? { ...o, status: "cancelled" } : o);
      setOrders(updated);
      applyFilter(activeFilter, updated);
      setMessage("Order cancelled successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Error cancelling order.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const applyFilter = (status, list = orders) => {
    setActiveFilter(status);
    setFilteredOrders(status === "all" ? list : list.filter((o) => o.status === status));
  };

  const BADGE_COLOR = {
    "pending COD": "yellow",
    shipped:       "blue",
    delivered:     "green",
    cancelled:     "red",
  };

  return (
    <div className="user-orders-container">
      <h3>Your Orders</h3>
      {message && <div className="order-message">{message}</div>}

      <div className="order-filters">
        {["all", "pending COD", "shipped", "delivered", "cancelled"].map((status) => (
          <button key={status} className={`filter-btn ${activeFilter === status ? "active" : ""}`} onClick={() => applyFilter(status)}>
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader-container"><div className="spinner" /></div>
      ) : filteredOrders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        <table border="1" width="100%">
          <thead>
            <tr>
              <th>Order ID</th><th>Total</th><th>Status</th>
              <th>Items</th><th>Cancel</th><th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td data-label="Order ID">{order._id}</td>
                <td data-label="Total">Rs {order.total}</td>
                <td data-label="Status">
                  <span className={`status-badge ${BADGE_COLOR[order.status] || "gray"}`}>{order.status}</span>
                </td>
                <td data-label="Items">{order.items.length}</td>
                <td data-label="Cancel">
                  {order.status === "pending COD"
                    ? <button className="order-cancel-btn" onClick={() => cancelOrder(order._id)}>Cancel</button>
                    : <span style={{ color: "#999" }}>—</span>}
                </td>
                <td data-label="Receipt">
                  {order.receiptUrl
                    ? <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer"><button className="receipt-btn">View Receipt</button></a>
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserOrders;
