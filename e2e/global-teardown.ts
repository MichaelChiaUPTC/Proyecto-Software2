import { cleanup } from './support/db'

export default async function globalTeardown() {
  cleanup()
}
