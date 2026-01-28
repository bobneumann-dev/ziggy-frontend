import { useCallback, useMemo, useState, useEffect } from 'react';
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
import { Save, Plus, Edit, Trash2 } from 'lucide-react';
import type { Cargo, Setor } from '../types';
import api from '../lib/api';

interface CargoOrgChartProps {
  cargos: Cargo[];
  setores: Setor[];
  onHierarchyUpdate?: () => void;
  onAddForSetor?: (setor: Setor) => void;
  onAddChild?: (cargo: Cargo) => void;
  onEdit?: (cargo: Cargo) => void;
  onDelete?: (cargo: Cargo) => void;
}

type NodeData = {
  kind: 'setor' | 'cargo';
  setor?: Setor;
  cargo?: Cargo;
};

export default function CargoOrgChart({
  cargos,
  setores,
  onHierarchyUpdate,
  onAddForSetor,
  onAddChild,
  onEdit,
  onDelete,
}: CargoOrgChartProps) {
  const buildHierarchy = useCallback(() => {
    const nodes: Node<NodeData>[] = [];
    const edges: Edge[] = [];

    const sectorSpacing = 360;
    const levelHeight = 140;
    const cargoSpacing = 260;

    setores.forEach((setor, sectorIndex) => {
      const sectorNodeId = `setor-${setor.id}`;
      const baseX = sectorIndex * sectorSpacing;

      nodes.push({
        id: sectorNodeId,
        type: 'default',
        position: { x: baseX, y: 0 },
        data: {
          kind: 'setor',
          setor,
          label: (
            <div className="org-sector-card nodrag nopan">
              <span>{setor.nome}</span>
              <button
                className="org-sector-add nodrag nopan"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddForSetor?.(setor);
                }}
                title="Adicionar cargo"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ),
        },
        style: {
          background: 'transparent',
          border: 'none',
          borderRadius: '12px',
          padding: 0,
          minWidth: '200px',
        },
        draggable: false,
        selectable: false,
      });

      const cargosDoSetor = cargos.filter(cargo => cargo.setorId === setor.id);
      const rootCargos = cargosDoSetor.filter(cargo => !cargo.cargoPaiId);

      const buildTree = (cargo: Cargo, level: number, parentX: number, siblingIndex: number, totalSiblings: number) => {
        const nodeId = cargo.id.toString();
        const x = parentX + (siblingIndex - (totalSiblings - 1) / 2) * cargoSpacing;
        const y = level * levelHeight + 110;

        nodes.push({
          id: nodeId,
          type: 'default',
          position: { x, y },
          data: {
            kind: 'cargo',
            cargo,
            label: (
              <div className="org-cargo-card">
                <div className="org-node-header">
                  <div className="org-node-title">
                    <span>{cargo.nome}</span>
                  </div>
                  <div className="org-node-actions">
                    <button
                      className="org-node-icon nodrag"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit?.(cargo);
                      }}
                      title="Editar cargo"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="org-node-icon org-node-icon-danger nodrag"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(cargo);
                      }}
                      title="Excluir cargo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="org-node-icon org-node-add nodrag"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddChild?.(cargo);
                      }}
                      title="Adicionar cargo filho"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="org-node-meta">
                  <span>{cargo.quantidadePessoas} pessoas</span>
                  <span>•</span>
                  <span>{cargo.quantidadeAtribuicoes} atribuições</span>
                </div>
              </div>
            ),
          },
          style: {
            background: 'transparent',
            border: 'none',
            borderRadius: '12px',
            padding: 0,
            minWidth: '190px',
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: true,
        });

        if (cargo.cargoPaiId) {
          edges.push({
            id: `e-${cargo.cargoPaiId}-${cargo.id}`,
            source: cargo.cargoPaiId.toString(),
            target: nodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#22d3ee', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#22d3ee',
            },
          });
        } else {
          edges.push({
            id: `e-${sectorNodeId}-${cargo.id}`,
            source: sectorNodeId,
            target: nodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '6 6' },
          });
        }

        const children = cargosDoSetor.filter(c => c.cargoPaiId === cargo.id);
        children.forEach((child, index) => {
          buildTree(child, level + 1, x, index, children.length);
        });
      };

      rootCargos.forEach((root, index) => {
        buildTree(root, 1, baseX, index, rootCargos.length);
      });
    });

    return { nodes, edges };
  }, [cargos, setores, onAddForSetor, onAddChild, onEdit, onDelete]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildHierarchy(), [buildHierarchy]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const { nodes: nextNodes, edges: nextEdges } = buildHierarchy();
    setNodes(nextNodes);
    setEdges(nextEdges);
    setIsModified(false);
  }, [buildHierarchy, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);

      if (!sourceNode || !targetNode) return;

      const sourceData = sourceNode.data as NodeData | undefined;
      const targetData = targetNode.data as NodeData | undefined;

      if (!sourceData || !targetData || sourceData.kind !== 'cargo' || targetData.kind !== 'cargo') {
        return;
      }

      if (sourceData.cargo?.setorId !== targetData.cargo?.setorId) {
        alert('Não é permitido conectar cargos de setores diferentes.');
        return;
      }

      // Check for cycles
      const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
        const directEdge = edges.find(e => e.source === targetId && e.target === sourceId);
        if (directEdge) return true;

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

      const existingParentEdge = edges.find(edge => edge.target === connection.target);
      if (existingParentEdge) {
        setEdges(eds => eds.filter(e => e.id !== existingParentEdge.id));
      }

      const newEdge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#22d3ee', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#22d3ee',
        },
      };

      setEdges(eds => addEdge(newEdge, eds));
      setIsModified(true);
    },
    [nodes, edges, setEdges]
  );

  const saveHierarchy = useCallback(async () => {
    try {
      const hierarchyUpdates = edges.map(edge => {
        const targetNode = nodes.find(node => node.id === edge.target);
        const sourceNode = nodes.find(node => node.id === edge.source);

        const targetData = targetNode?.data as NodeData | undefined;
        const sourceData = sourceNode?.data as NodeData | undefined;

        if (targetData?.kind === 'cargo' && sourceData?.kind === 'cargo') {
          return {
            id: targetData.cargo?.id,
            cargoPaiId: sourceData.cargo?.id,
          };
        }
        return null;
      }).filter(Boolean);

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
        fitView
        attributionPosition="bottom-left"
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#22d3ee' }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#22d3ee', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' },
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
          nodeColor="#22d3ee"
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


