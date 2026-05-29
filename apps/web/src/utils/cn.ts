type ClassValue = string | number | bigint | null | false | undefined | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  const walk = (v: ClassValue): void => {
    if (!v && v !== 0) return
    if (Array.isArray(v)) v.forEach(walk)
    else out.push(String(v))
  }
  inputs.forEach(walk)
  return out.join(' ')
}
