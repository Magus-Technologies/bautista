import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Shield, Save, Plus, Trash2, Key, Eye, PlusCircle, 
    Pencil, ChevronDown, ChevronRight, Lock, Layout, 
    FileText, Image as ImageIcon, MessageSquare, ListCheck,
    Building2, Newspaper, Search, RotateCcw, Edit, Briefcase
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import api from '@/lib/api';
import ConfirmModal from '@/components/shared/ConfirmModal';
import FormField from '@/components/shared/FormField';
import TitleForm from '@/components/TitleForm';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    es_trabajador?: boolean;
    permissions: Permission[];
};

interface PermissionNode {
    name: string;
    fullName: string;
    permission: Permission | null;
    children: PermissionNode[];
}

export default function AccessControlManager() {
    const { can } = usePermission();
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    
    // Modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleEsTrabajador, setNewRoleEsTrabajador] = useState(false);
    const [editingRoleName, setEditingRoleName] = useState('');
    const [editingRoleEsTrabajador, setEditingRoleEsTrabajador] = useState(false);

    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['dashboard', 'perfil']));
    const [searchQuery, setSearchQuery] = useState('');
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    
    // Roles del sistema que pueden ser restablecidos
    const systemRoles = ['administrador', 'usuario', 'docente', 'estudiante', 'padre_familia', 'madre_familia', 'apoderado', 'rh'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/seguridad/roles'),
                api.get('/seguridad/permisos')
            ]);
            setRoles(rolesRes.data);
            setAllPermissions(permsRes.data);
            
            if (rolesRes.data.length > 0 && !selectedRole) {
                handleSelectRole(rolesRes.data[0]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = (role: Role) => {
        setSelectedRole(role);
        
        // Poblar editedPermissions con los permisos reales Y todos sus ancestros para la UI
        const permsSet = new Set<string>();
        role.permissions.forEach(p => {
            const parts = p.name.split('.');
            let current = '';
            parts.forEach(part => {
                current = current ? `${current}.${part}` : part;
                permsSet.add(current);
            });
        });
        
        setEditedPermissions(Array.from(permsSet));
    };

    // --- Lógica de árbol ---
    const permissionTree = useMemo(() => {
        const root: PermissionNode[] = [];

        allPermissions.forEach(p => {
            const parts = p.name.split('.');
            let currentLevel = root;
            let currentFullName = '';

            parts.forEach((part, index) => {
                currentFullName = currentFullName ? `${currentFullName}.${part}` : part;
                let node = currentLevel.find(n => n.name === part);

                if (!node) {
                    node = {
                        name: part,
                        fullName: currentFullName,
                        permission: null,
                        children: []
                    };
                    currentLevel.push(node);
                }

                if (index === parts.length - 1) {
                    node.permission = p;
                }

                currentLevel = node.children;
            });
        });

        // Ordenar: poner los nodos con permiso 'ver' primero o agrupar por lógica
        if (!searchQuery.trim()) return root;

        const query = searchQuery.toLowerCase();
        const filterNode = (node: PermissionNode): PermissionNode | null => {
            const matches = node.fullName.toLowerCase().includes(query) || node.name.replace('_', ' ').toLowerCase().includes(query);
            const filteredChildren = node.children.map(filterNode).filter(Boolean) as PermissionNode[];
            if (matches || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        };

        return root.map(filterNode).filter(Boolean) as PermissionNode[];
    }, [allPermissions, searchQuery]);

    const togglePermission = (name: string, checked: boolean) => {
        setEditedPermissions(prev => {
            let next = new Set(prev);

            if (checked) {
                // REGLA 1: Marcar este permiso y todos sus ANCESTROS (padres)
                const parts = name.split('.');
                let current = '';
                parts.forEach(part => {
                    current = current ? `${current}.${part}` : part;
                    next.add(current);
                });
            } else {
                // REGLA 2: Desmarcar este permiso y todos sus DESCENDIENTES (hijos)
                next.delete(name);
                Array.from(next).forEach(p => {
                    if (p.startsWith(`${name}.`)) {
                        next.delete(p);
                    }
                });
            }

            return Array.from(next);
        });
    };

    const toggleExpand = (fullName: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(fullName)) next.delete(fullName);
            else next.add(fullName);
            return next;
        });
    };

    // --- CRUD ---
    const handleSavePermissions = () => setShowConfirmModal(true);

    const confirmSavePermissions = async () => {
        if (!selectedRole) return;
        setProcessing(true);
        try {
            // Filtrar solo los permisos que REALMENTE existen en la DB (para no enviar nodos intermedios que no tienen ID)
            const validPerms = editedPermissions.filter(name => 
                allPermissions.some(ap => ap.name === name)
            );

            await api.put(`/seguridad/roles/${selectedRole.id}`, {
                name: selectedRole.name,
                permissions: validPerms
            });
            await loadData();
            setShowConfirmModal(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        } finally {
            setProcessing(false);
        }
    };

    const handleResetPermissions = () => setShowResetModal(true);

    const confirmResetPermissions = async () => {
        if (!selectedRole) return;
        setProcessing(true);
        try {
            await api.post(`/seguridad/roles/${selectedRole.id}/restablecer-permisos`);
            await loadData();
            setShowResetModal(false);
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.message || 'Error al restablecer permisos');
        } finally {
            setProcessing(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        setProcessing(true);
        try {
            await api.post('/seguridad/roles', { 
                name: newRoleName.toLowerCase().replace(/\s+/g, '_'),
                es_trabajador: newRoleEsTrabajador
            });
            setNewRoleName('');
            setNewRoleEsTrabajador(false);
            setShowCreateModal(false);
            await loadData();
        } catch (e) {
            console.error(e);
            alert('Error al crear rol');
        } finally {
            setProcessing(false);
        }
    };

    const handleEditRole = async () => {
        if (!selectedRole || !editingRoleName.trim()) return;
        setProcessing(true);
        try {
            await api.put(`/seguridad/roles/${selectedRole.id}`, { 
                name: editingRoleName.toLowerCase().replace(/\s+/g, '_'),
                es_trabajador: editingRoleEsTrabajador
            });
            setEditingRoleName('');
            setEditingRoleEsTrabajador(false);
            setShowEditModal(false);
            await loadData();
        } catch (e) {
            console.error(e);
            alert('Error al editar rol');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!selectedRole) return;
        setProcessing(true);
        try {
            await api.delete(`/seguridad/roles/${selectedRole.id}`);
            setSelectedRole(null);
            setShowDeleteModal(false);
            await loadData();
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.message || 'Error al eliminar rol');
        } finally {
            setProcessing(false);
        }
    };

    const openEditModal = () => {
        if (!selectedRole) return;
        setEditingRoleName(selectedRole.name);
        setEditingRoleEsTrabajador(selectedRole.es_trabajador ?? false);
        setShowEditModal(true);
    };

    const openDeleteModal = () => {
        if (!selectedRole) return;
        setShowDeleteModal(true);
    };

    const getIcon = (name: string, isGroup: boolean) => {
        if (isGroup) {
            if (name === 'institucion') return <Building2 className="size-4" />;
            if (name === 'noticias') return <Newspaper className="size-4" />;
            if (name === 'galeria') return <ImageIcon className="size-4" />;
            if (name === 'datos' || name === 'datos_basicos') return <FileText className="size-4" />;
            if (name === 'matriculas') return <ListCheck className="size-4" />;
            return <Layout className="size-4" />;
        }
        if (name.includes('ver')) return <Eye className="size-3.5" />;
        if (name.includes('crear')) return <PlusCircle className="size-3.5" />;
        if (name.includes('editar')) return <Pencil className="size-3.5" />;
        if (name.includes('eliminar') || name.includes('borrar')) return <Trash2 className="size-3.5" />;
        if (name.includes('comentar')) return <MessageSquare className="size-3.5" />;
        return <Key className="size-3.5" />;
    };

    // --- Componente de Nodo ---
    const PermissionNodeComponent = ({ node, level = 0 }: { node: PermissionNode, level?: number }) => {
        const isSearching = searchQuery.trim().length > 0;
        const isExpanded = isSearching || expandedNodes.has(node.fullName);
        const isChecked = editedPermissions.includes(node.fullName);
        const hasChildren = node.children.length > 0;

        return (
            <div className="flex flex-col">
                <div className={cn(
                    "flex items-center justify-between py-2.5 px-3 rounded-lg transition-all",
                    isChecked ? "bg-indigo-50 border border-indigo-100" : "hover:bg-gray-50 border border-transparent"
                )}>
                    <div className="flex items-center gap-3 flex-1">
                        {/* Checkbox */}
                        <Checkbox 
                            id={`node-${node.fullName}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => togglePermission(node.fullName, !!checked)}
                            className="size-4"
                        />

                        {/* Icono y Texto */}
                        <div 
                            className="flex items-center gap-2 cursor-pointer select-none flex-1"
                            onClick={() => hasChildren ? toggleExpand(node.fullName) : togglePermission(node.fullName, !isChecked)}
                        >
                            <div className={cn(
                                "p-1.5 rounded-md",
                                isChecked ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
                            )}>
                                {getIcon(node.name, hasChildren)}
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                isChecked ? "text-gray-900" : "text-gray-600"
                            )}>
                                {node.name.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Botón de Expansión */}
                    {hasChildren && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleExpand(node.fullName)}
                            className={cn(
                                "size-7 transition-transform",
                                isExpanded && "rotate-90"
                            )}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    )}
                </div>

                {/* Hijos */}
                {hasChildren && isExpanded && (
                    <div className="ml-6 pl-3 border-l-2 border-gray-200 mt-1 mb-2 space-y-1">
                        {node.children.map(child => (
                            <PermissionNodeComponent key={child.fullName} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando configuración de seguridad avanzada...</div>;

    return (
        <>
            <ConfirmModal
                open={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmSavePermissions}
                title="Confirmar cambios jerárquicos"
                message={`¿Estás seguro de que deseas actualizar los permisos del rol "${selectedRole?.name.replace('_', ' ')}"? Los cambios afectarán la visibilidad de vistas completas y sus acciones asociadas.`}
                processing={processing}
                confirmText="Sincronizar Permisos"
                variant="warning"
            />

            <ConfirmModal
                open={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={confirmResetPermissions}
                title="Restablecer permisos por defecto"
                message={`¿Estás seguro de que deseas restablecer los permisos del rol "${selectedRole?.name.replace('_', ' ')}" a su configuración original del sistema? Esta acción sobrescribirá todos los cambios personalizados.`}
                processing={processing}
                confirmText="Restablecer Permisos"
                variant="danger"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar de Roles */}
                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Shield className="size-5 text-indigo-600" /> Roles
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {roles.length} roles configurados
                                    </CardDescription>
                                </div>
                                {can('seguridad.roles.crear') && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setShowCreateModal(true)}
                                        className="gap-2"
                                    >
                                        <Plus className="size-4" /> Nuevo
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                            {roles.map(role => (
                                <div
                                    key={role.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer group",
                                        selectedRole?.id === role.id 
                                        ? "bg-indigo-50 border-2 border-indigo-200" 
                                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                                    )}
                                    onClick={() => handleSelectRole(role)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-bold truncate",
                                            selectedRole?.id === role.id ? "text-indigo-900" : "text-gray-700"
                                        )}>
                                            {role.name.replace('_', ' ').toUpperCase()}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {role.permissions.length} permisos
                                        </p>
                                    </div>
                                    
                                    {selectedRole?.id === role.id && (
                                        <div className="flex items-center gap-1 ml-2">
                                            {can('seguridad.roles.editar') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 hover:bg-indigo-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal();
                                                    }}
                                                    title={systemRoles.includes(role.name) ? "Editar configuración de trabajador" : "Editar rol"}
                                                >
                                                    <Edit className="size-4 text-indigo-600" />
                                                </Button>
                                            )}
                                            {can('seguridad.roles.eliminar') && !systemRoles.includes(role.name) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 hover:bg-red-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteModal();
                                                    }}
                                                >
                                                    <Trash2 className="size-4 text-red-600" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {selectedRole && systemRoles.includes(selectedRole.name) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Lock className="size-5 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Rol del Sistema</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Este rol no puede ser eliminado ni renombrado. Solo puedes modificar sus permisos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Editor de Permisos */}
                <div className="lg:col-span-8">
                    {selectedRole ? (
                        <Card>
                            <CardHeader className="border-b pb-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-xl font-bold">
                                                Permisos: <span className="text-indigo-600">{selectedRole.name.replace('_', ' ').toUpperCase()}</span>
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-1">
                                                Selecciona los permisos que tendrá este rol
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {can('seguridad.roles.editar') && systemRoles.includes(selectedRole.name) && (
                                                <Button
                                                    onClick={handleResetPermissions}
                                                    disabled={processing}
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                >
                                                    <RotateCcw className="size-4" /> Restablecer
                                                </Button>
                                            )}
                                            {can('seguridad.roles.editar') && (
                                                <Button 
                                                    onClick={handleSavePermissions} 
                                                    disabled={processing}
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                                                >
                                                    <Save className="size-4" /> {processing ? 'Guardando...' : 'Guardar'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                        <Input 
                                            className="pl-10" 
                                            placeholder="Buscar permiso..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-6">
                                <div className="space-y-2">
                                    {permissionTree.map(node => (
                                        <PermissionNodeComponent key={node.fullName} node={node} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Shield className="size-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Selecciona un Rol</h3>
                            <p className="text-sm text-gray-500 mt-2 max-w-sm">
                                Elige un rol del panel izquierdo para ver y editar sus permisos
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle asChild>
                            <TitleForm>Crear Nuevo Rol</TitleForm>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <FormField
                            label="Nombre del Rol"
                            required
                            value={newRoleName}
                            onChange={setNewRoleName}
                            placeholder="Ej: supervisor, coordinador..."
                        />
                        
                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <Checkbox 
                                id="new-es-trabajador"
                                checked={newRoleEsTrabajador}
                                onCheckedChange={(checked) => setNewRoleEsTrabajador(!!checked)}
                                className="size-5"
                            />
                            <div className="flex-1">
                                <Label htmlFor="new-es-trabajador" className="text-sm font-bold text-blue-900 cursor-pointer flex items-center gap-2">
                                    <Briefcase className="size-4" />
                                    Rol de Trabajador / Personal
                                </Label>
                                <p className="text-xs text-blue-700 mt-1">
                                    Los usuarios con este rol aparecerán en el módulo de Recursos Humanos
                                </p>
                            </div>
                        </div>
                        
                        <p className="text-xs text-gray-500">
                            El nombre se convertirá automáticamente a minúsculas y los espacios a guiones bajos
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateRole} disabled={processing || !newRoleName.trim()}>
                            {processing ? 'Creando...' : 'Crear Rol'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle asChild>
                            <TitleForm>Editar Rol</TitleForm>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedRole && systemRoles.includes(selectedRole.name) ? (
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Nombre del Rol</Label>
                                <div className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                                    <p className="text-sm font-bold text-gray-900">{editingRoleName.replace('_', ' ').toUpperCase()}</p>
                                    <p className="text-xs text-gray-500 mt-1">Los roles del sistema no pueden ser renombrados</p>
                                </div>
                            </div>
                        ) : (
                            <FormField
                                label="Nombre del Rol"
                                required
                                value={editingRoleName}
                                onChange={setEditingRoleName}
                                placeholder="Nombre del rol..."
                            />
                        )}
                        
                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <Checkbox 
                                id="edit-es-trabajador"
                                checked={editingRoleEsTrabajador}
                                onCheckedChange={(checked) => setEditingRoleEsTrabajador(!!checked)}
                                className="size-5"
                            />
                            <div className="flex-1">
                                <Label htmlFor="edit-es-trabajador" className="text-sm font-bold text-blue-900 cursor-pointer flex items-center gap-2">
                                    <Briefcase className="size-4" />
                                    Rol de Trabajador / Personal
                                </Label>
                                <p className="text-xs text-blue-700 mt-1">
                                    Los usuarios con este rol aparecerán en el módulo de Recursos Humanos
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditRole} disabled={processing || !editingRoleName.trim()}>
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteRole}
                title="Eliminar Rol"
                message={`¿Estás seguro de que deseas eliminar el rol "${selectedRole?.name.replace('_', ' ')}"? Esta acción no se puede deshacer y todos los usuarios con este rol perderán sus permisos.`}
                processing={processing}
                confirmText="Eliminar Rol"
                variant="danger"
            />
        </>
    );
}
