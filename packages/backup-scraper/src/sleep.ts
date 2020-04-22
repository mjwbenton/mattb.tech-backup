export default function sleep(ms: number): Promise<void> {
  console.log(`Sleeping ${ms}`);
  return new Promise(resolve => setTimeout(resolve, ms));
}
