import { computed, ref, watch } from 'vue'

// Client-side pagination over a reactive source (a ref or a getter that returns
// an array). Returns the current page's slice plus the state a PaginationBar
// needs to render. Behaviour:
//   - page resets to 1 whenever the source list changes (a new filter/search
//     result or a freshly fetched table) so the user is never stranded on a
//     page that no longer exists;
//   - page resets to 1 when the page size grows (keeps the rows selector
//     predictable);
//   - page clamps into range when the page count shrinks.
export function usePagination(source, options = {}) {
  const pageSizeOptions = options.pageSizeOptions || [12, 24, 48]
  const pageSize = ref(options.initialPageSize ?? pageSizeOptions[0])
  const page = ref(1)

  const items = computed(() => {
    const value = typeof source === 'function' ? source() : source?.value
    return Array.isArray(value) ? value : []
  })

  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  const pagedItems = computed(() => {
    const startIndex = (page.value - 1) * pageSize.value
    return items.value.slice(startIndex, startIndex + pageSize.value)
  })

  // New result set -> back to the first page.
  watch(items, () => { page.value = 1 })
  // Larger page size -> first page.
  watch(pageSize, () => { page.value = 1 })
  // Page count shrank under the current page -> clamp into range.
  watch(totalPages, (count) => {
    if (page.value > count) page.value = count
  })

  return { page, pageSize, pageSizeOptions, total, totalPages, pagedItems }
}
