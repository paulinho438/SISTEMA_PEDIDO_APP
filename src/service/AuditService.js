import axios from '@/plugins/axios';

class AuditService {
  /**
   * Lista registros de auditoria com filtros e paginação.
   * @param {Object} params - auditable_type, auditable_id, user_id, action, date_from, date_to, per_page, page
   */
  getAuditLog(params = {}) {
    return axios.get('/auditoria', { params });
  }
}

export default new AuditService();
