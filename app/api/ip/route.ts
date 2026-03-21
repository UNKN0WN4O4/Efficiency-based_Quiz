import { NextResponse } from "next/server";
import { networkInterfaces } from "os";

export async function GET() {
  const nets = networkInterfaces();
  
  let wifiIp = "";
  let bestIp = "";
  let fallbackIp = "";

  for (const name of Object.keys(nets)) {
    const lowerName = name.toLowerCase();
    
    // Detect typical virtual adapter names
    const isVirtual = lowerName.includes("virtual") || 
                      lowerName.includes("vbox") || 
                      lowerName.includes("vmware") || 
                      lowerName.includes("wsl") || 
                      lowerName.includes("veth") ||
                      lowerName.includes("hyper-v");

    // Explicitly identify wireless adapters (which teachers heavily use in classrooms)
    const isWifi = lowerName.includes("wi-fi") || 
                   lowerName.includes("wireless") || 
                   lowerName.includes("wlan");

    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        if (isWifi && !wifiIp) {
            wifiIp = net.address; // Highly confident
        }
        if (!isVirtual && !bestIp) {
            bestIp = net.address; // Somewhat confident
        }
        if (!fallbackIp) {
            fallbackIp = net.address; // Fallback
        }
      }
    }
  }

  // Prioritize Wi-Fi over regular Ethernet in case VirtualBox hijacks the Ethernet naming
  const localIp = wifiIp || bestIp || fallbackIp || "localhost";

  return NextResponse.json({ ip: localIp });
}
