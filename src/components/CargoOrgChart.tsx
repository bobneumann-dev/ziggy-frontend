import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  addEdge,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import type { Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { Briefcase, Save } from 'lucide-react';
import type { Cargo } from '../types';
import api from '../lib/api';

interface CargoOrgChartProps {
  cargos: Cargo[];
  onNodeClick?: (cargo: Cargo) => void;
  onHierarchyUpdate?: () => void;
}

export default function CargoOrgChart({ cargos, onNodeClick, onHierarchyUpdate }: CargoOrgChartProps) {
  const buildHierarchy = useCallback(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, { x: number; y: number; level: number }>();
    
    // Encontrar cargos raiz (sem pai)
    const rootCargos = cargos.filter(c => !c.cargoPaiId);
    
    // Função recursiva para construir a árvore
    const buildTree = (cargo: Cargo, level: number, parentX: number, siblingIndex: number, totalSiblings: number) => {
      const nodeId = cargo.id.toString();
      const spacing = 280;
      const levelHeight = 160;
      
      // Calcular posição X baseado nos irmãos
      const x = parentX + (siblingIndex - (totalSiblings - 1) / 2) * spacing;
      const y = level * levelHeight;
      
      nodeMap.set(nodeId, { x, y, level });
      
      // Criar nó
      const isRoot = !cargo.cargoPaiId;
      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div className="px-4 py-3 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-cyan-400" />
              <span className="font-medium text-white">{cargo.nome}</span>
            </div>
          ),
          cargo: cargo,
        },
        style: {
          background: isRoot ? '#1e40af' : '#1e3a8a',
          border: isRoot ? '2px solid #0891b2' : '1px solid #2563eb',
          borderRadius: '4px',
          padding: 0,
          minWidth: '150px',
          color: '#fff',
          fontSize: '14px',
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        draggable: true,
      });
      
      // Criar edge se tiver pai
      if (cargo.cargoPaiId) {
        edges.push({
          id: `e-${cargo.cargoPaiId}-${cargo.id}`,
          source: cargo.cargoPaiId.toString(),
          target: nodeId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#06b6d4',
          },
        });
      }
      
      // Processar filhos
      const children = cargos.filter(c => c.cargoPaiId === cargo.id);
      children.forEach((child, index) => {
        buildTree(child, level + 1, x, index, children.length);
      });
    };
    
    // Construir árvore a partir dos nós raiz
    rootCargos.forEach((root, index) => {
      buildTree(root, 0, index * 350, 0, 1);
    });
    
    return { nodes, edges };
  }, [cargos]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildHierarchy(), [buildHierarchy]);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isModified, setIsModified] = useState(false);
  
  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);
      
      if (sourceNode && targetNode) {
        // Check for cycles - prevent a node from being connected to its descendants
        const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
          // Check direct connection (target -> source would create a cycle)
          const directEdge = edges.find(e => e.source === targetId && e.target === sourceId);
          if (directEdge) return true;
          
          // Check if target is already an ancestor of source
          const findDescendants = (nodeId: string): string[] => {
            const children = edges
              .filter(e => e.source === nodeId)
              .map(e => e.target);
            
            return children.reduce((acc, childId) => [
              ...acc,
              childId,
              ...findDescendants(childId)
            ], [] as string[]);
          };
          
          const descendants = findDescendants(targetId);
          return descendants.includes(sourceId);
        };
        
        if (wouldCreateCycle(connection.source!, connection.target!)) {
          alert('Esta conexão criaria um ciclo, o que não é permitido em uma estrutura hierárquica.');
          return;
        }
        
        // Check if target already has a parent
        const existingParentEdge = edges.find(edge => edge.target === connection.target);
        if (existingParentEdge) {
          // Remove existing parent connection before adding new one
          setEdges(eds => eds.filter(e => e.id !== existingParentEdge.id));
        }
        
        // Add new edge
        const newEdge = {
          ...connection,
          id: `e-${connection.source}-${connection.target}`,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#0891b2', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#0891b2',
          },
        };
        
        setEdges(eds => addEdge(newEdge, eds));
        setIsModified(true);
      }
    },
    [nodes, edges, setEdges]
  );

  const onNodeClickHandler = useCallback((_event: React.MouseEvent, node: Node) => {
    const cargo = cargos.find(c => c.id.toString() === node.id);
    if (cargo && onNodeClick) {
      onNodeClick(cargo);
    }
  }, [cargos, onNodeClick]);

  const saveHierarchy = useCallback(async () => {
    try {
      // Extract parent-child relationships from edges
      const hierarchyUpdates = edges.map(edge => {
        const sourceNodeId = edge.source;
        const targetNodeId = edge.target;
        
        // Find the corresponding nodes to get the cargo data
        const targetNode = nodes.find(node => node.id === targetNodeId);
        const sourceNode = nodes.find(node => node.id === sourceNodeId);
        
        if (targetNode && sourceNode && targetNode.data.cargo && sourceNode.data.cargo) {
          return {
            id: targetNode.data.cargo.id,
            cargoPaiId: sourceNode.data.cargo.id
          };
        }
        return null;
      }).filter(Boolean);
      
      // Send updated hierarchy to backend
      await api.post('/cargos/update-hierarchy', { updates: hierarchyUpdates });
      setIsModified(false);
      
      if (onHierarchyUpdate) {
        onHierarchyUpdate();
      }
      
      alert('Hierarquia atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar hierarquia:', error);
      alert('Ocorreu um erro ao salvar a hierarquia.');
    }
  }, [edges, nodes, onHierarchyUpdate]);

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-blue-900 bg-blue-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        fitView
        attributionPosition="bottom-left"
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#0891b2' }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#0891b2', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0891b2' },
        }}
      >
        <Background color="#1e3a8a" gap={20} size={1} />
        <Controls className="rounded-lg bg-blue-900 border border-blue-800" />
        <MiniMap 
          className="rounded-lg"
          style={{
            background: 'rgba(23, 37, 84, 0.9)',
            border: '1px solid #1e40af'
          }}
          nodeColor="#0891b2"
          maskColor="rgba(0, 0, 0, 0.7)"
        />
        <Panel position="top-right">
          <button 
            className={`flex items-center space-x-2 px-3 py-2 rounded-md ${isModified ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-800 opacity-50 cursor-not-allowed'}`}
            onClick={saveHierarchy}
            disabled={!isModified}
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
