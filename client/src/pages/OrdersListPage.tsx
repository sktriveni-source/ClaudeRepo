import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { RequirementOrder } from "../types";
import { StatusBadge } from "../components/StatusBadge";

function currentStageLabel(order: RequirementOrder): string {
  if (order.phase === "CLOSED") return "Closed";
  if (order.phase === "RAW_MATERIALS") return `Raw materials — ${order.rawMaterial.stage}`;
  return `Manufacturing — ${order.manufacturing.stage}`;
}

export function OrdersListPage() {
  const [orders, setOrders] = useState<RequirementOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"));
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Requirement Orders</h1>
          <p className="page__subtitle">Track every order across raw materials, manufacturing and delivery.</p>
        </div>
        <Link to="/new" className="button primary">
          + New Requirement
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {!orders && !error && <p>Loading…</p>}
      {orders && orders.length === 0 && (
        <div className="card empty-state">
          <p>No requirement orders yet.</p>
          <Link to="/new" className="button primary">
            Create the first one
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="card">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Phase</th>
                <th>Current stage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.productName}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <StatusBadge label={order.phase} />
                  </td>
                  <td>{currentStageLabel(order)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
