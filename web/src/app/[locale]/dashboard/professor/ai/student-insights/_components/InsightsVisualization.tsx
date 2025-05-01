"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize, Minimize, RotateCcw, Download } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Plot component from react-plotly.js to avoid SSR issues
const Plot = dynamic(() => import("react-plotlyjs"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />
});

type TopicCluster = {
  id: string;
  name: string;
  count: number;
  difficulty: number;
  color: string;
};

type InsightsVisualizationProps = {
  visualizationData: any;
  topicClusters: TopicCluster[];
  selectedStudent: string;
  selectedClass: string;
};

export default function InsightsVisualization({
  visualizationData,
  topicClusters,
  selectedStudent,
  selectedClass
}: InsightsVisualizationProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [layout, setLayout] = useState({
    height: 400,
    width: null,
    scene: {
      xaxis: {
        title: 'Component 1',
        showticklabels: false,
        showgrid: true,
        zeroline: true,
      },
      yaxis: {
        title: 'Component 2',
        showticklabels: false,
        showgrid: true,
        zeroline: true,
      },
      zaxis: {
        title: 'Component 3',
        showticklabels: false,
        showgrid: true,
        zeroline: true,
      },
      camera: {
        eye: { x: 1.25, y: 1.25, z: 1.25 }
      }
    },
    margin: { l: 0, r: 0, b: 0, t: 0 },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: -0.2
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    uirevision: 'true',
  });

  const [plotData, setPlotData] = useState<any>(null);

  // Process the data for the 3D plot
  useEffect(() => {
    if (!visualizationData) return;

    try {
      // Transform the data for plotting
      const traces = topicClusters.map((cluster) => {
        // Get points for this cluster
        const clusterPoints = visualizationData.points.filter(
          (point: any) => point.cluster_id === cluster.id
        );

        // Extract coordinates
        const x = clusterPoints.map((p: any) => p.x);
        const y = clusterPoints.map((p: any) => p.y);
        const z = clusterPoints.map((p: any) => p.z);
        const labels = clusterPoints.map((p: any) => p.label);
        const ids = clusterPoints.map((p: any) => p.id);

        // Create scatter3d trace
        return {
          type: 'scatter3d',
          mode: 'markers',
          x,
          y,
          z,
          text: labels,
          customdata: ids,
          name: cluster.name,
          marker: {
            size: 6,
            color: cluster.color,
            opacity: 0.7
          },
          hoverinfo: 'text',
          hovertemplate: '%{text}<extra></extra>'
        };
      });

      // Add centers of clusters if available
      if (visualizationData.centers && visualizationData.centers.length > 0) {
        const centerTrace = {
          type: 'scatter3d',
          mode: 'markers',
          x: visualizationData.centers.map((center: any) => center.x),
          y: visualizationData.centers.map((center: any) => center.y),
          z: visualizationData.centers.map((center: any) => center.z),
          text: visualizationData.centers.map((center: any, i: number) =>
            topicClusters[i] ? `${topicClusters[i].name} (center)` : 'Cluster center'
          ),
          name: 'Cluster Centers',
          marker: {
            size: 10,
            color: visualizationData.centers.map((center: any, i: number) =>
              topicClusters[i] ? topicClusters[i].color : '#000000'
            ),
            symbol: 'diamond',
            opacity: 0.9,
            line: {
              color: '#ffffff',
              width: 1
            }
          },
          hoverinfo: 'text',
          hovertemplate: '%{text}<extra></extra>'
        };

        traces.push(centerTrace);
      }

      setPlotData(traces);
    } catch (error) {
      console.error("Error processing visualization data:", error);
    }
  }, [visualizationData, topicClusters]);

  // Handle resize for responsive plot
  const handleResize = useCallback(() => {
    setLayout(prevLayout => ({
      ...prevLayout,
      width: isFullScreen
        ? window.innerWidth * 0.9
        : document.querySelector('.visualization-container')?.clientWidth || 600,
      height: isFullScreen ? window.innerHeight * 0.8 : 400
    }));
  }, [isFullScreen]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Animation function for the plot camera
  useEffect(() => {
    if (!isAnimating) return;

    let frame = 0;
    const totalFrames = 1000;
    const animationSpeed = 0.005;

    const animate = () => {
      if (!isAnimating) return;

      frame = (frame + 1) % totalFrames;
      const angle = frame * animationSpeed;

      // Calculate new camera position
      const radius = 1.75 + Math.sin(angle * 0.5) * 0.25; // Oscillating radius
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = 1.5 + Math.sin(angle * 0.7) * 0.5; // Oscillating height

      setLayout(prevLayout => ({
        ...prevLayout,
        scene: {
          ...prevLayout.scene,
          camera: { eye: { x, y, z } }
        }
      }));

      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isAnimating]);

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Reset camera view
  const resetCamera = () => {
    setLayout(prevLayout => ({
      ...prevLayout,
      scene: {
        ...prevLayout.scene,
        camera: { eye: { x: 1.25, y: 1.25, z: 1.25 } }
      }
    }));
  };

  // Export the visualization as PNG
  const exportVisualization = () => {
    if (typeof window !== 'undefined') {
      const plotElement = document.querySelector('.js-plotly-plot');
      if (plotElement) {
        // @ts-ignore - Plotly is added to window by the Plot component
        window.Plotly.toImage(plotElement, {format: 'png', width: 1200, height: 800})
          .then(function(dataUrl: string) {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `ai-insights-${selectedClass}-${selectedStudent}.png`;
            link.click();
          });
      }
    }
  };

  // If we don't have visualization data yet
  if (!visualizationData || !plotData) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-[400px]">
        <div className="text-center space-y-4">
          <div className="rounded-full bg-primary/10 p-4 mx-auto">
            <RotateCcw className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h3 className="text-lg font-medium">Generating visualization</h3>
          <p className="text-sm text-muted-foreground">
            Processing embedding data for 3D visualization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`visualization-container relative ${isFullScreen ? 'fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6' : ''}`}>
      <div className="absolute top-2 right-2 flex space-x-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullScreen}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetCamera}
          className="bg-background/80 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportVisualization}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-2 left-2 z-10">
        <Button
          variant={isAnimating ? "default" : "outline"}
          size="sm"
          onClick={() => setIsAnimating(!isAnimating)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isAnimating ? "Stop Animation" : "Start Animation"}
        </Button>
      </div>

      <div onClick={() => setIsAnimating(false)}>
        <Plot
          data={plotData}
          layout={layout}
          config={{
            displayModeBar: true,
            displaylogo: false,
            responsive: true,
            modeBarButtonsToRemove: [
              'sendDataToCloud',
              'autoScale2d',
              'toggleSpikelines',
              'hoverClosestCartesian',
              'hoverCompareCartesian',
              'resetScale2d'
            ]
          }}
          onClick={(data) => {
            if (data.points && data.points.length > 0 && data.points[0].customdata) {
              console.log("Selected point ID:", data.points[0].customdata);
              // Here you could add functionality to view session details
            }
          }}
        />
      </div>

      {isFullScreen && (
        <div className="absolute bottom-4 left-0 right-0 mx-auto px-6 max-w-3xl">
          <Card>
            <CardContent className="p-4 text-sm">
              <div className="flex flex-wrap gap-4">
                {topicClusters.map(cluster => (
                  <div key={cluster.id} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                    <span>{cluster.name} ({cluster.count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
