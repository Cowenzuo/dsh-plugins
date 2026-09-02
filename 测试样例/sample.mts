// TypeScript 样例
interface User {
  id: number
  name: string
}

function find(users: User[], id: number): User | undefined {
  return users.find((u) => u.id === id)
}
