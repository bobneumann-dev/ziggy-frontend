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
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import type { Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Plus, Edit, Trash2, X, Users } from 'lucide-react';
import type { Cargo, Setor, Pessoa } from '../types';
import api from '../lib/api';

interface CargoOrgChartProps {
  cargos: Cargo[];
  setores: Setor[];
  selectedSetorId?: string;
  onSelectedSetorChange?: (setorId: string) => void;
  pessoasPorCargo?: Map<string, Pessoa[]>;
  pessoasSemVinculo?: Pessoa[];
  onMovePessoa?: (pessoaId: string, cargo: Cargo) => void;
  onRemovePessoa?: (pessoaId: string) => void;
  onMovedMessage?: (pessoaId: string, cargo: Cargo) => void;
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

function CargoOrgChartInner({
  cargos,
  setores,
  selectedSetorId,
  onSelectedSetorChange,
  pessoasPorCargo,
  pessoasSemVinculo,
  onMovePessoa,
  onRemovePessoa,
  onMovedMessage,
  onHierarchyUpdate,
  onAddForSetor,
  onAddChild,
  onEdit,
  onDelete,
}: CargoOrgChartProps) {
  const [isUnassignedOpen, setIsUnassignedOpen] = useState(false);
  const handleDragStart = (event: React.DragEvent, pessoaId: string) => {
    event.dataTransfer.setData('text/plain', pessoaId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnCargo = (event: React.DragEvent, cargo: Cargo) => {
    event.preventDefault();
    const pessoaId = event.dataTransfer.getData('text/plain');
    if (!pessoaId) return;
    onMovePessoa?.(pessoaId, cargo);
    onMovedMessage?.(pessoaId, cargo);
  };

  const handleDropOnSemVinculo = (event: React.DragEvent) => {
    event.preventDefault();
    const pessoaId = event.dataTransfer.getData('text/plain');
    if (!pessoaId) return;
    onRemovePessoa?.(pessoaId);
  };

  const buildHierarchy = useCallback(() => {
    const nodes: Node<NodeData>[] = [];
    const edges: Edge[] = [];

    const sectorSpacing = 460;
    const levelHeight = 190;
    const cargoSpacing = 320;

    const setoresFiltrados = selectedSetorId
      ? setores.filter(setor => setor.id === selectedSetorId)
      : setores;

    const baseOffset = setoresFiltrados.length === 1 ? 0 : undefined;
    setoresFiltrados.forEach((setor, sectorIndex) => {
      const sectorNodeId = `setor-${setor.id}`;
      const baseX = baseOffset !== undefined ? baseOffset : sectorIndex * sectorSpacing;

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
        const pessoasDoCargo = pessoasPorCargo?.get(cargo.id) ?? [];

        nodes.push({
          id: nodeId,
          type: 'default',
          position: { x, y },
          data: {
            kind: 'cargo',
            cargo,
            label: (
              <div
                className="org-cargo-card"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDropOnCargo(event, cargo)}
              >
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
                <div className="org-cargo-people">
                  {pessoasDoCargo.length === 0 ? (
                    <span className="org-cargo-empty">Sem pessoas</span>
                  ) : (
                    pessoasDoCargo.map(pessoa => (
                      <div
                        key={pessoa.id}
                        className="org-cargo-person nodrag"
                        draggable
                        onDragStart={(event) => handleDragStart(event, pessoa.id)}
                      >
                        <div className="org-cargo-person-avatar">
                          {pessoa.foto ? (
                            <img src={pessoa.foto} alt={pessoa.nomeCompleto} />
                          ) : (
                            <span>{getInitials(pessoa.nomeCompleto)}</span>
                          )}
                        </div>
                        <span>{formatName(pessoa.nomeCompleto)}</span>
                        <button
                          className="org-cargo-remove"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRemovePessoa?.(pessoa.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
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
  }, [cargos, setores, selectedSetorId, pessoasPorCargo, onAddForSetor, onAddChild, onEdit, onDelete]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildHierarchy(), [buildHierarchy]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isModified, setIsModified] = useState(false);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const id = setTimeout(() => {
      fitView({ padding: 0.25, duration: 300 });
    }, 0);
    return () => clearTimeout(id);
  }, [fitView, selectedSetorId, nodes.length, edges.length]);

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
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
            <select
              className="org-canvas-filter"
              value={selectedSetorId ?? ''}
              onChange={(event) => onSelectedSetorChange?.(event.target.value)}
            >
              <option value="">Todos os setores</option>
              {setores.map(setor => (
                <option key={setor.id} value={setor.id}>{setor.nome}</option>
              ))}
            </select>
            <button 
              className={`flex items-center space-x-2 px-3 py-2 rounded-md ${isModified ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-800 opacity-50 cursor-not-allowed'}`}
              onClick={saveHierarchy}
              disabled={!isModified}
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
            </div>
            <div className="org-people-panel">
              <button
                className="org-people-toggle"
                onClick={() => setIsUnassignedOpen(prev => !prev)}
              >
                <Users className="w-4 h-4" />
                <span>Sem vínculo</span>
              </button>
              {isUnassignedOpen && (
                <div
                  className="org-people-pool"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDropOnSemVinculo}
                >
                  {pessoasSemVinculo && pessoasSemVinculo.length > 0 ? (
                    <div className="org-people-list">
                      {pessoasSemVinculo.map(pessoa => (
                        <div
                          key={pessoa.id}
                          className="org-people-item"
                          draggable
                          onDragStart={(event) => handleDragStart(event, pessoa.id)}
                        >
                          <div className="org-cargo-person-avatar">
                            {pessoa.foto ? (
                              <img src={pessoa.foto} alt={pessoa.nomeCompleto} />
                            ) : (
                              <span>{getInitials(pessoa.nomeCompleto)}</span>
                            )}
                          </div>
                          <span>{formatName(pessoa.nomeCompleto)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="org-cargo-empty">Vazio</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function CargoOrgChart(props: CargoOrgChartProps) {
  return (
    <ReactFlowProvider>
      <CargoOrgChartInner {...props} />
    </ReactFlowProvider>
  );
}


  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const formatName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length <= 35) return trimmed;
    return `${trimmed.slice(0, 35)}...`;
  };
