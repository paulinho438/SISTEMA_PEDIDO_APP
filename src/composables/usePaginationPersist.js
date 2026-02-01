const STORAGE_PREFIX = 'pagination_';

/**
 * Persiste rows por página e página atual no sessionStorage.
 * Ao voltar para a lista (ex: após visualizar um item), a escolha é mantida.
 * @param {string} storageKey - Chave única por tela (ex: 'produtos-estoque', 'filiais', route.name)
 * @param {number} defaultRows - Valor inicial de itens por página (ex: 10)
 * @returns {{ getInitialPagination: () => { rows: number, page: number }, savePagination: (rows: number, page: number) => void }}
 */
export function usePaginationPersist(storageKey, defaultRows = 10) {
  const key = STORAGE_PREFIX + (storageKey || 'list');

  function getInitialPagination() {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return { rows: defaultRows, page: 1 };
      const parsed = JSON.parse(raw);
      const rows = Math.max(1, parseInt(parsed.rows, 10) || defaultRows);
      const page = Math.max(1, parseInt(parsed.page, 10) || 1);
      return { rows, page };
    } catch {
      return { rows: defaultRows, page: 1 };
    }
  }

  function savePagination(rows, page) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ rows: Number(rows) || defaultRows, page: Math.max(1, Number(page) || 1) }));
    } catch (_) {}
  }

  return { getInitialPagination, savePagination };
}
