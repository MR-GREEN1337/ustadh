"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { graphColors } from "@/lib/utils";
import { Info, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

// Dynamically import the Plot component to avoid SSR issues
const PlotComponent = dynamic(
  () => import("react-plotly.js").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full rounded-lg" />
  }
);

// Define clusters for the visualization
const CLUSTERS = [
  { id: "cluster-1", name: "Customer Questions", color: graphColors[0] },
  { id: "cluster-2", name: "Support Requests", color: graphColors[1] },
  { id: "cluster-3", name: "Feedback", color: graphColors[2] },
  { id: "cluster-4", name: "Bug Reports", color: graphColors[3] },
  { id: "cluster-5", name: "Feature Requests", color: graphColors[4] }
];

/**
 * Generate mock data for the 3D plot visualization
 */
function generateVisualizationData() {
  const points = [];

  // Generate points for each cluster
  CLUSTERS.forEach((cluster, clusterIndex) => {
    // Create a center point for this cluster
    const centerX = Math.cos(clusterIndex * Math.PI * 0.4) * 0.8;
    const centerY = Math.sin(clusterIndex * Math.PI * 0.4) * 0.8;
    const centerZ = (clusterIndex % 3) * 0.4 - 0.4;

    // Generate 30-50 points around this center
    const numPoints = 30 + Math.floor(Math.random() * 20);

    for (let i = 0; i < numPoints; i++) {
      // Random offset from center
      const offsetX = (Math.random() - 0.5) * 0.3;
      const offsetY = (Math.random() - 0.5) * 0.3;
      const offsetZ = (Math.random() - 0.5) * 0.3;

      points.push({
        x: centerX + offsetX,
        y: centerY + offsetY,
        z: centerZ + offsetZ,
        clusterId: cluster.id,
        clusterName: cluster.name,
        color: cluster.color,
        id: `point-${clusterIndex}-${i}`,
        label: `Item ${i+1} in ${cluster.name}`
      });
    }
  });

  return points;
}

/**
 * Responsive 3D Plot Component
 */
export default function Responsive3DPlot({
  data = null,
  height = 500,
  interactive = true,
  showControls = true,
  showLegend = true,
  onPointClick = null,
  className = "",
}) {
  // Generate mock data if none is provided
  const [plotData, setPlotData] = useState(null);
  const [layout, setLayout] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Initialize the data and layout
  useEffect(() => {
    const points = data || generateVisualizationData();

    // Format the data for Plotly
    const plotlyData = CLUSTERS.map(cluster => {
      const clusterPoints = points.filter(p => p.clusterId === cluster.id);
      return {
        type: 'scatter3d',
        mode: 'markers',
        name: cluster.name,
        x: clusterPoints.map(p => p.x),
        y: clusterPoints.map(p => p.y),
        z: clusterPoints.map(p => p.z),
        text: clusterPoints.map(p => p.label),
        customdata: clusterPoints.map(p => p.id),
        marker: {
          size: 6,
          color: cluster.color,
          opacity: 0.8,
          line: {
            color: '#fff',
            width: 0.5
          }
        },
        hoverinfo: 'text',
        hovertemplate: '%{text}<extra></extra>'
      };
    });

    setPlotData(plotlyData);

    // Set initial layout
    setLayout({
      height: height,
      autosize: true,
      margin: { l: 0, r: 0, b: 0, t: 0, pad: 0 },
      scene: {
        xaxis: {
          visible: false,
          showgrid: false,
          zeroline: false,
          showspikes: false
        },
        yaxis: {
          visible: false,
          showgrid: false,
          zeroline: false,
          showspikes: false
        },
        zaxis: {
          visible: false,
          showgrid: false,
          zeroline: false,
          showspikes: false
        },
        camera: {
          eye: { x: 1.25, y: 1.25, z: 1.25 },
          up: { x: 0, y: 0, z: 1 },
          center: { x: 0, y: 0, z: 0 }
        },
        dragmode: interactive ? 'orbit' : false
      },
      showlegend: showLegend,
      legend: {
        orientation: 'h',
        y: -0.15,
        yanchor: 'top'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      uirevision: 'true',
    });
  }, [data, height, interactive, showLegend]);

  // Handle container resizing
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      setContainerWidth(width);
      setLayout(prevLayout => ({
        ...prevLayout,
        width: width
      }));
    }
  }, []);

  useEffect(() => {
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [updateDimensions]);

  // Reset camera view to default
  const resetCamera = () => {
    setLayout(prevLayout => ({
      ...prevLayout,
      scene: {
        ...prevLayout.scene,
        camera: {
          eye: { x: 1.25, y: 1.25, z: 1.25 },
          up: { x: 0, y: 0, z: 1 },
          center: { x: 0, y: 0, z: 0 }
        }
      }
    }));
  };

  // Zoom in
  const zoomIn = () => {
    setLayout(prevLayout => {
      const currentEye = prevLayout.scene.camera.eye;
      const factor = 0.8; // Zoom in by reducing distance by 20%
      return {
        ...prevLayout,
        scene: {
          ...prevLayout.scene,
          camera: {
            ...prevLayout.scene.camera,
            eye: {
              x: currentEye.x * factor,
              y: currentEye.y * factor,
              z: currentEye.z * factor
            }
          }
        }
      };
    });
  };

  // Zoom out
  const zoomOut = () => {
    setLayout(prevLayout => {
      const currentEye = prevLayout.scene.camera.eye;
      const factor = 1.25; // Zoom out by increasing distance by 25%
      return {
        ...prevLayout,
        scene: {
          ...prevLayout.scene,
          camera: {
            ...prevLayout.scene.camera,
            eye: {
              x: currentEye.x * factor,
              y: currentEye.y * factor,
              z: currentEye.z * factor
            }
          }
        }
      };
    });
  };

  // Handle click on data point
  const handleDataPointClick = (data) => {
    if (onPointClick && data.points && data.points.length > 0) {
      const point = data.points[0];
      onPointClick({
        id: point.customdata,
        label: point.text,
        cluster: point.data.name
      });
    }
  };

  if (!plotData || !layout) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: height }}
    >
      <div className="w-full h-full">
        <PlotComponent
          data={plotData}
          layout={layout}
          config={{
            displayModeBar: interactive,
            displaylogo: false,
            responsive: true,
            scrollZoom: interactive,
            modeBarButtonsToRemove: [
              'sendDataToCloud',
              'autoScale2d',
              'toggleSpikelines',
              'hoverClosestCartesian',
              'hoverCompareCartesian',
              'lasso2d',
              'select2d'
            ]
          }}
          onClick={handleDataPointClick}
          useResizeHandler={true}
          className="w-full h-full"
        />
      </div>

      {showControls && (
        <div className="absolute top-2 right-2 flex space-x-2 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={zoomIn}
            className="bg-background/80 backdrop-blur-sm"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={zoomOut}
            className="bg-background/80 backdrop-blur-sm"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={resetCamera}
            className="bg-background/80 backdrop-blur-sm"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showLegend && (
        <div className="absolute bottom-0 left-0 right-0 pb-10">
          <Card className="mx-auto w-fit max-w-[80%] p-2 flex flex-wrap gap-3 justify-center items-center bg-background/80 backdrop-blur-sm">
            {CLUSTERS.map(cluster => (
              <div key={cluster.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cluster.color }}
                />
                <span className="text-xs">{cluster.name}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div className="absolute bottom-2 right-2 opacity-70 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Click and drag to rotate. Scroll to zoom."
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
