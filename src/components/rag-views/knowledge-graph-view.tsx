'use client'

import React, { useState, useEffect } from 'react'
import { Share2, Search, ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Settings } from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  type: 'entity' | 'concept' | 'document' | 'keyword'
  connections: number
  importance: number
  x?: number
  y?: number
}

interface GraphEdge {
  source: string
  target: string
  weight: number
  type: 'relates_to' | 'contains' | 'similar_to' | 'part_of'
}

interface KnowledgeGraphViewProps {
  actionContext?: string
  params?: Record<string, unknown>
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ actionContext }) => {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('all')
  const [zoomLevel, setZoomLevel] = useState(1)

  // Mock knowledge graph data
  useEffect(() => {
    const mockNodes: GraphNode[] = [
      {
        id: '1',
        label: 'Product Documentation',
        type: 'document',
        connections: 8,
        importance: 0.9,
        x: 400,
        y: 300
      },
      {
        id: '2',
        label: 'Installation',
        type: 'concept',
        connections: 5,
        importance: 0.7,
        x: 200,
        y: 200
      },
      {
        id: '3',
        label: 'Troubleshooting',
        type: 'concept',
        connections: 6,
        importance: 0.8,
        x: 600,
        y: 200
      },
      {
        id: '4',
        label: 'Safety Guidelines',
        type: 'entity',
        connections: 4,
        importance: 0.6,
        x: 300,
        y: 100
      },
      {
        id: '5',
        label: 'Warranty',
        type: 'keyword',
        connections: 3,
        importance: 0.5,
        x: 500,
        y: 100
      },
      {
        id: '6',
        label: 'User Manual v2.1',
        type: 'document',
        connections: 7,
        importance: 0.8,
        x: 100,
        y: 350
      },
      {
        id: '7',
        label: 'Technical Specifications',
        type: 'entity',
        connections: 9,
        importance: 0.9,
        x: 700,
        y: 350
      }
    ]

    const mockEdges: GraphEdge[] = [
      { source: '1', target: '2', weight: 0.8, type: 'contains' },
      { source: '1', target: '3', weight: 0.7, type: 'contains' },
      { source: '1', target: '4', weight: 0.6, type: 'relates_to' },
      { source: '2', target: '4', weight: 0.5, type: 'relates_to' },
      { source: '3', target: '7', weight: 0.7, type: 'relates_to' },
      { source: '4', target: '5', weight: 0.4, type: 'similar_to' },
      { source: '6', target: '2', weight: 0.6, type: 'contains' },
      { source: '6', target: '4', weight: 0.5, type: 'contains' },
      { source: '7', target: '1', weight: 0.8, type: 'part_of' }
    ]

    setTimeout(() => {
      setNodes(mockNodes)
      setEdges(mockEdges)
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = nodeTypeFilter === 'all' || node.type === nodeTypeFilter
    return matchesSearch && matchesType
  })

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'document': return 'bg-blue-500'
      case 'concept': return 'bg-green-500'
      case 'entity': return 'bg-purple-500'
      case 'keyword': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getNodeSize = (importance: number) => {
    return Math.max(20, importance * 40)
  }

  const getEdgeColor = (type: GraphEdge['type']) => {
    switch (type) {
      case 'contains': return 'stroke-blue-400'
      case 'relates_to': return 'stroke-green-400'
      case 'similar_to': return 'stroke-purple-400'
      case 'part_of': return 'stroke-yellow-400'
      default: return 'stroke-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Knowledge Graph
          </h1>
          <p className="text-gray-600">
            {actionContext ? `Context: ${actionContext}` : 'Explore relationships and connections in your knowledge base'}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search and Filter */}
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes..."
                  className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={nodeTypeFilter}
                onChange={(e) => setNodeTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="document">Documents</option>
                <option value="concept">Concepts</option>
                <option value="entity">Entities</option>
                <option value="keyword">Keywords</option>
              </select>
            </div>

            {/* Graph Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Reset View"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded" title="Fullscreen">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded" title="Export">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded" title="Settings">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Graph Visualization */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-96 lg:h-[600px] relative">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 600"
                className="w-full h-full"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Edges */}
                <g>
                  {edges.map((edge, index) => {
                    const sourceNode = nodes.find(n => n.id === edge.source)
                    const targetNode = nodes.find(n => n.id === edge.target)
                    
                    if (!sourceNode || !targetNode) return null
                    
                    // Only show edges for filtered nodes
                    const sourceVisible = filteredNodes.some(n => n.id === edge.source)
                    const targetVisible = filteredNodes.some(n => n.id === edge.target)
                    
                    if (!sourceVisible || !targetVisible) return null

                    return (
                      <line
                        key={`edge-${index}`}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        className={`${getEdgeColor(edge.type)} transition-all`}
                        strokeWidth={edge.weight * 3}
                        opacity={0.6}
                      />
                    )
                  })}
                </g>

                {/* Nodes */}
                <g>
                  {filteredNodes.map((node) => (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={getNodeSize(node.importance)}
                        className={`${getNodeColor(node.type)} cursor-pointer transition-all hover:opacity-80 ${
                          selectedNode?.id === node.id ? 'ring-4 ring-blue-300' : ''
                        }`}
                        onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                        fill="currentColor"
                      />
                      <text
                        x={node.x}
                        y={(node.y || 0) + getNodeSize(node.importance) + 15}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700 pointer-events-none"
                        style={{ fontSize: '10px' }}
                      >
                        {node.label.length > 15 ? `${node.label.substring(0, 15)}...` : node.label}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>

              {/* Legend */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Node Types</h4>
                <div className="space-y-1">
                  {[
                    { type: 'document', label: 'Documents', color: 'bg-blue-500' },
                    { type: 'concept', label: 'Concepts', color: 'bg-green-500' },
                    { type: 'entity', label: 'Entities', color: 'bg-purple-500' },
                    { type: 'keyword', label: 'Keywords', color: 'bg-yellow-500' }
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zoom Level Indicator */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 border border-gray-200">
                <span className="text-xs text-gray-600">{Math.round(zoomLevel * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Node Details Panel */}
          <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {selectedNode ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-4 h-4 rounded-full ${getNodeColor(selectedNode.type)}`}></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedNode.label}</h3>
                    <p className="text-sm text-gray-500 capitalize">{selectedNode.type}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Connections</label>
                    <p className="text-2xl font-bold text-gray-900">{selectedNode.connections}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Importance Score</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedNode.importance * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{(selectedNode.importance * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Connected Nodes</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {edges
                        .filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id)
                        .map((edge, index) => {
                          const connectedNodeId = edge.source === selectedNode.id ? edge.target : edge.source
                          const connectedNode = nodes.find(n => n.id === connectedNodeId)
                          if (!connectedNode) return null

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                              onClick={() => setSelectedNode(connectedNode)}
                            >
                              <div className={`w-2 h-2 rounded-full ${getNodeColor(connectedNode.type)}`}></div>
                              <span className="text-sm text-gray-700 flex-1">{connectedNode.label}</span>
                              <span className="text-xs text-gray-500 capitalize">{edge.type.replace('_', ' ')}</span>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedNode(null)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Share2 className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Knowledge Graph
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Click on any node to view its details and connections
                </p>
                <div className="text-left space-y-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Total Nodes:</span> {nodes.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Total Connections:</span> {edges.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Filtered:</span> {filteredNodes.length} nodes
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeGraphView
