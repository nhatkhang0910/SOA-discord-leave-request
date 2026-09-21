// store.js
// Lưu trữ tạm trong bộ nhớ (demo). Thực tế nên thay bằng Database (MongoDB, PostgreSQL...)

const leaveRequests = new Map();

function create(request) {
  leaveRequests.set(request.id, request);
  return request;
}

function getById(id) {
  return leaveRequests.get(id);
}

function getAll({ status } = {}) {
  const all = Array.from(leaveRequests.values());
  if (status) return all.filter((r) => r.status === status);
  return all;
}

function update(id, patch) {
  const existing = leaveRequests.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  leaveRequests.set(id, updated);
  return updated;
}

module.exports = { create, getById, getAll, update };
