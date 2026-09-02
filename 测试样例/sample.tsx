// TSX 样例
export function List<T>({ items }: { items: T[] }): React.JSX.Element {
  return (
    <ul>
      {items.map((item, i) => <li key={i}>{String(item)}</li>)}
    </ul>
  )
}
