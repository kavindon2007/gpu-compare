import { Metadata } from "next"
import HomeClient from "./home-client"

export const metadata: Metadata = {
  title: "GPU Compare — Live GPU Pricing & Free Compute Tracker",
  description: "Compare real-time GPU cloud pricing across RunPod, Vast.ai and more. Find the cheapest GPUs and track free compute tiers.",
}

export default function Page() {
  return <HomeClient />
}
