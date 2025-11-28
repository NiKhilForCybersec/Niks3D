import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AuthStep } from '../types';
import { Network, Server, Shield, Globe, FileText, ArrowRight, RefreshCcw } from 'lucide-react';

// The steps described in the prompt
const STEPS: AuthStep[] = [
  { id: 1, title: "DNS Resolution", description: "Client queries internal DNS for intranet.corp.local", source: "user", target: "dns" },
  { id: 2, title: "DNS Response", description: "DNS server returns internal IP (10.x.x.x)", source: "dns", target: "user" },
  { id: 3, title: "ARP Request", description: "Client resolves MAC address of Gateway/Server", source: "user", target: "gateway" },
  { id: 4, title: "TCP Handshake", description: "SYN → SYN-ACK → ACK to establish connection", source: "user", target: "server" },
  { id: 5, title: "Authentication", description: "Kerberos TGT presented to KDC, Service Ticket obtained (or NTLM fallback)", source: "user", target: "kdc" },
  { id: 6, title: "Authorization", description: "Server checks ACLs and Permissions", source: "server", target: "server" },
  { id: 7, title: "Data Transfer", description: "Authorized data flows back to client", source: "server", target: "user" },
];

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  icon: any;
  color: string;
}

const NODES: Node[] = [
  { id: "user", label: "Client PC", x: 100, y: 300, icon: Network, color: "#60a5fa" },
  { id: "dns", label: "DNS Server", x: 300, y: 100, icon: Globe, color: "#f472b6" },
  { id: "gateway", label: "Gateway", x: 300, y: 500, icon: Server, color: "#a78bfa" },
  { id: "kdc", label: "KDC (AD)", x: 500, y: 100, icon: Shield, color: "#fbbf24" },
  { id: "server", label: "File Server", x: 600, y: 300, icon: FileText, color: "#34d399" },
];

export const AuthVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto-play logic
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= STEPS.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // D3 Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = 800;
    const height = 600;

    // Draw Links (background lines)
    // We can draw implicit links or specific ones. Let's draw a mesh for context.
    const links = [
      { source: "user", target: "dns" },
      { source: "user", target: "gateway" },
      { source: "user", target: "server" },
      { source: "user", target: "kdc" }, // Logical flow
    ];
    
    // However, for the animation, we will draw transient links.
    // Let's just draw nodes first.

    // 1. Defs for glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // 2. Draw Nodes
    NODES.forEach(node => {
      const g = svg.append("g")
        .attr("transform", `translate(${node.x}, ${node.y})`);

      // Circle bg
      g.append("circle")
        .attr("r", 40)
        .attr("fill", "#1e293b")
        .attr("stroke", node.color)
        .attr("stroke-width", 3)
        .style("filter", "url(#glow)");

      // Label
      g.append("text")
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-family", "Inter, sans-serif")
        .attr("font-size", "14px")
        .attr("font-weight", "600")
        .text(node.label);
        
      // Icon placeholder (D3 isn't great at rendering React components inside SVG easily without foreignObject complexity)
      // We will use simple text or basic shapes for icons in pure D3 to keep it robust
      g.append("text")
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("fill", node.color)
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .text(node.label[0]); // First letter as icon
    });

    // 3. Draw Active Packet / Flow based on currentStep
    if (currentStep > 0 && currentStep <= STEPS.length) {
      const step = STEPS[currentStep - 1];
      const sourceNode = NODES.find(n => n.id === step.source);
      const targetNode = NODES.find(n => n.id === step.target);

      if (sourceNode && targetNode) {
        // Draw connection line
        const link = svg.append("line")
          .attr("x1", sourceNode.x)
          .attr("y1", sourceNode.y)
          .attr("x2", targetNode.x)
          .attr("y2", targetNode.y)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("opacity", 0.5);

        // Animate packet
        const packet = svg.append("circle")
          .attr("r", 8)
          .attr("fill", "#fff");

        // Loop animation for packet
        const animatePacket = () => {
          packet
            .attr("cx", sourceNode.x)
            .attr("cy", sourceNode.y)
            .transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .attr("cx", targetNode.x)
            .attr("cy", targetNode.y)
            .on("end", animatePacket);
        };
        
        if (step.source === step.target) {
            // Self-loop animation (Authorization check)
             packet
            .attr("cx", sourceNode.x)
            .attr("cy", sourceNode.y - 40)
            .transition()
            .duration(1000)
            .attr("cy", sourceNode.y - 60)
            .transition()
            .duration(1000)
            .attr("cy", sourceNode.y - 40)
            .on("end", animatePacket);
        } else {
            animatePacket();
        }

        // Highlight nodes
        svg.selectAll("circle")
           .filter((d: any, i, nodes) => {
             // This is tricky without data binding, let's just redraw generic highlight
             return false; 
           });
           
        // Add label to the line
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        svg.append("rect")
            .attr("x", midX - 60)
            .attr("y", midY - 15)
            .attr("width", 120)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("fill", "#0f172a")
            .attr("stroke", "#475569");
            
        svg.append("text")
            .attr("x", midX)
            .attr("y", midY + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#94a3b8")
            .attr("font-size", "12px")
            .text(step.title);
      }
    }

  }, [currentStep]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
        <div className="flex-1 relative overflow-hidden flex justify-center items-center bg-slate-900/50">
            {/* SVG Container */}
            <svg 
                ref={svgRef} 
                viewBox="0 0 800 600" 
                className="w-full h-full max-w-4xl max-h-[80vh]"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
            />
            
            {/* Step Description Overlay */}
            <div className="absolute top-4 left-4 max-w-sm">
                <div className="bg-slate-800/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-2">Network Flow</h2>
                    {currentStep === 0 ? (
                        <p className="text-slate-400">Ready to visualize intranet authentication flow.</p>
                    ) : (
                        <div>
                             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 block">Step {currentStep} of {STEPS.length}</span>
                             <h3 className="text-lg font-semibold text-white mb-1">{STEPS[currentStep - 1].title}</h3>
                             <p className="text-slate-300 text-sm leading-relaxed">{STEPS[currentStep - 1].description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="h-20 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
                <button 
                    onClick={reset}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Reset"
                >
                    <RefreshCcw className="w-5 h-5" />
                </button>
                <div className="h-8 w-px bg-slate-700 mx-2"></div>
                <button 
                    onClick={prevStep}
                    disabled={currentStep <= 0}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                    Previous
                </button>
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        isPlaying 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    }`}
                >
                    {isPlaying ? 'Pause' : 'Auto Play'}
                </button>
                <button 
                    onClick={nextStep}
                    disabled={currentStep >= STEPS.length}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    Next <ArrowRight className="w-4 h-4" />
                </button>
            </div>
            
            {/* Progress Indicators */}
            <div className="flex gap-2">
                {STEPS.map((step) => (
                    <div 
                        key={step.id}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            currentStep >= step.id 
                            ? 'bg-indigo-500 scale-110 shadow-lg shadow-indigo-500/50' 
                            : 'bg-slate-700'
                        }`}
                        title={step.title}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};