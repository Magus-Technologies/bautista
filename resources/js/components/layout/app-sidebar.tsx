import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    CreditCard,
    DoorOpen,
    GraduationCap,
    LayoutDashboard,
    MessageSquare,
    Settings,
    UserCheck,
    Library,
    Newspaper,
    Users,
    Gamepad2,
    QrCode,
    Calendar,
    Shield
} from 'lucide-react';
import { useState, useMemo } from 'react';
import AppLogo from '@/components/layout/app-logo';
import { NavUser } from '@/components/layout/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';

type NavChild = { 
    title: string; 
    href: string;
    permission?: string;
};

type NavItem = { 
    type: 'section'; 
    label: string; 
    permission?: string;
} | { 
    type: 'link'; 
    title: string; 
    icon: React.ElementType; 
    href: string; 
    permission?: string;
} | { 
    type: 'group'; 
    title: string; 
    icon: React.ElementType; 
    children: NavChild[]; 
    permission?: string;
};

const navigation: NavItem[] = [
    // ── Menú de Navegación ──────────────────────────────────────────────
    { type: 'section', label: 'MENÚ DE NAVEGACIÓN' },
    { type: 'link', title: 'Inicio',           icon: LayoutDashboard, href: '/dashboard', permission: 'dashboard.ver' },
    { type: 'link', title: 'Mi Credencial',    icon: QrCode,          href: '/credencial', permission: 'credencial.ver' },
    { type: 'link', title: 'Portada de Noticias', icon: Newspaper,    href: '/institucion/noticias/portada', permission: 'institucion.noticias.portada' },
    { type: 'group', title: 'Institución', icon: Building2, children: [
        { title: 'Datos Básicos', href: '/institucion', permission: 'institucion.datos.ver' },
        { title: 'Galería',       href: '/institucion/galeria', permission: 'institucion.galeria.ver' },
        { title: 'Noticias',      href: '/institucion/noticias', permission: 'institucion.noticias.ver' },
    ]},
    { type: 'link', title: 'Comunicados',     icon: Newspaper,       href: '/mensajes', permission: 'admin.comunicados.ver' },
    { type: 'link', title: 'Pagos',           icon: CreditCard,      href: '/pagos', permission: 'admin.pagos.ver' },

    // ── Información Académica ────────────────────────────────────────
    { type: 'section', label: 'GESTIÓN ACADÉMICA' },
    { type: 'group', title: 'Niveles Académicos', icon: BookOpen, children: [
        { title: 'Niveles',            href: '/niveles', permission: 'academico.niveles.ver' },
        { title: 'Grados / Cursos',    href: '/cursos', permission: 'academico.cursos.ver' },
        { title: 'Grados / Secciones', href: '/secciones', permission: 'academico.secciones.ver' },
    ]},
    { type: 'group', title: 'Horarios', icon: Calendar, children: [
        { title: 'Aulas',                  href: '/aulas', permission: 'academico.aulas.ver' },
        { title: 'Horario de Clases',      href: '/horario-clases', permission: 'horarios.ver' },
        { title: 'Horarios de Asistencia', href: '/horarios', permission: 'horarios.asistencia.ver' },
    ]},
    { type: 'link', title: 'Gestión de Docentes',  icon: UserCheck, href: '/docentes', permission: 'personal.docentes.ver' },
    { type: 'link', title: 'Gestión de Alumnos', icon: GraduationCap, href: '/estudiantes', permission: 'personal.estudiantes.ver' },

    // ── Portales ─────────────────────────────────────────────────────
    { type: 'section', label: 'PORTALES' },
    { type: 'group', title: 'Portal Docente', icon: Users, children: [
        { title: 'Mis Cursos',    href: '/docente/mis-cursos',  permission: 'portal.docente.cursos' },
        { title: 'Mis Alumnos',   href: '/docente/mis-alumnos', permission: 'portal.docente.alumnos' },
        { title: 'Mi Asistencia', href: '/docente/asistencia',  permission: 'portal.docente.ver' },
    ]},
    { type: 'group', title: 'Portal Estudiante', icon: GraduationCap, children: [
        { title: 'Mis Cursos', href: '/alumno/cursos', permission: 'portal.estudiante.cursos' },
        { title: 'Mis Profesores', href: '/alumno/profesores', permission: 'portal.estudiante.profesores' },
        { title: 'Mi Asistencia', href: '/alumno/asistencia', permission: 'portal.estudiante.asistencia' },
        { title: 'Mis Notas',   href: '/alumno/notas', permission: 'portal.estudiante.notas' },
        { title: 'Rompecabezas', href: '/alumno/puzzles', permission: 'portal.estudiante.puzzles' },
    ]},
    { type: 'group', title: 'Portal Familia', icon: Users, children: [
        { title: 'Mis Hijos',   href: '/padre/dashboard',   permission: 'portal.padre.hijos' },
        { title: 'Asistencia',  href: '/padre/asistencia',  permission: 'portal.padre.hijos' },
        { title: 'Mis Pagos',   href: '/padre/pagos',       permission: 'portal.padre.pagos' },
        { title: 'Profesores',  href: '/padre/profesores',  permission: 'portal.padre.profesores' },
        { title: 'Horario',     href: '/padre/horario',     permission: 'portal.padre.ver' },
    ]},

    // ── Procedimientos ───────────────────────────────────────────────
    { type: 'section', label: 'PROCEDIMIENTOS' },
    { type: 'group', title: 'Matrícula', icon: ClipboardList, children: [
        { title: 'Aperturas / Cierre', href: '/matriculas', permission: 'matriculas.aperturas.ver' },
        { title: 'Nuevos Ingresos',    href: '/matriculas/gestion', permission: 'matriculas.gestion.ver' },
    ]},
    { type: 'group', title: 'Asistencia', icon: CalendarDays, children: [
        { title: 'Gestión / Reportes', href: '/asistencia', permission: 'asistencia.reportes.ver' },
        { title: 'Escáner QR',        href: '/asistencia/scanner', permission: 'asistencia.scanner.ver' },
    ]},

    // ── Recursos ─────────────────────────────────────────────────────
    { type: 'section', label: 'RECURSOS' },
    { type: 'link', title: 'Biblioteca', icon: Library, href: '/biblioteca', permission: 'recursos.biblioteca.ver' },
    { type: 'link', title: 'Mensajes Privados', icon: MessageSquare, href: '/mensajeria', permission: 'recursos.mensajeria.ver' },

    // ── Sistema ──────────────────────────────────────────────────────
    { type: 'section', label: 'SISTEMA' },
    { type: 'group', title: 'Seguridad', icon: Shield, children: [
        { title: 'Usuarios', href: '/usuarios', permission: 'seguridad.usuarios.ver' },
        { title: 'Roles y Permisos', href: '/roles-permisos', permission: 'seguridad.roles.ver' },
        { title: 'Config. Fotochecks', href: '/seguridad/fotocheck', permission: 'seguridad.fotochecks.diseno' },
    ]},
];

function NavLinkItem({ item }: { item: Extract<NavItem, { type: 'link' }> }) {
    const page = usePage();
    const path = page.url;
    const isActive = path.startsWith(item.href);
    const { state, isMobile } = useSidebar();

    const btnClass = cn(
        'transition-colors',
        isActive
            ? state === 'collapsed' && !isMobile 
                ? 'bg-sidebar-accent text-white' 
                : 'border-l-2 border-[#00a65a] bg-sidebar-accent text-white pl-[10px]'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
    );

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={item.title} className={btnClass}>
                <Link href={item.href} className={cn(state === 'collapsed' && !isMobile && '!justify-center !p-0')}>
                    <item.icon className="size-4" />
                    {(state === 'expanded' || isMobile) && (
                        <span className="text-xs font-semibold uppercase tracking-tight">{item.title}</span>
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function NavGroupItem({ item }: { item: Extract<NavItem, { type: 'group' }> }) {
    const page = usePage();
    const path = page.url;
    const { state, isMobile } = useSidebar();
    const [open, setOpen] = useState(() =>
        item.children.some((c) => path.startsWith(c.href)),
    );
    const isGroupActive = item.children.some((c) => path.startsWith(c.href));

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => setOpen(!open)}
                tooltip={item.title}
                className={cn(
                    'cursor-pointer transition-colors',
                    state === 'collapsed' && !isMobile && '!justify-center !p-0',
                    isGroupActive
                        ? state === 'collapsed' && !isMobile
                            ? 'bg-sidebar-accent text-white'
                            : 'border-l-2 border-[#00a65a] bg-sidebar-accent text-white pl-[10px]'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                )}
            >
                <item.icon className="size-4" />
                {(state === 'expanded' || isMobile) && (
                    <>
                        <span className="flex-1 text-xs font-black uppercase tracking-tighter">{item.title}</span>
                        <ChevronRight className={cn('size-3.5 transition-transform duration-200', open && 'rotate-90')} />
                    </>
                )}
            </SidebarMenuButton>

            {open && (state === 'expanded' || isMobile) && (
                <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                    {item.children.map((child) => (
                        <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                                'rounded-md px-2 py-1.5 text-xs font-bold uppercase tracking-tight transition-colors',
                                path === child.href
                                    ? 'font-medium text-white'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white',
                            )}
                        >
                            {child.title}
                        </Link>
                    ))}
                </div>
            )}
        </SidebarMenuItem>
    );
}

export function AppSidebar() {
    const { can } = usePermission();
    const { state, isMobile } = useSidebar();

    const filteredNavigation = useMemo(() => {
        return navigation.map(item => {
            if (item.type === 'link') {
                if (item.permission && !can(item.permission)) return null;
                return item;
            }

            if (item.type === 'group') {
                const visibleChildren = item.children.filter(child => {
                    if (child.permission) return can(child.permission);
                    return true;
                });

                const groupPermissionMet = item.permission ? can(item.permission) : false;
                if (visibleChildren.length === 0 && !groupPermissionMet) return null;
                return { ...item, children: visibleChildren };
            }

            if (item.type === 'section') {
                if (item.permission && !can(item.permission)) return null;
                return item;
            }

            return item;
        }).filter(Boolean) as NavItem[];
    }, [can]);

    const groups = useMemo(() => {
        interface NavSection {
            section?: string;
            items: NavItem[];
        }
        
        const result: NavSection[] = [];
        let currentGroup: NavSection | null = null;

        for (const item of filteredNavigation) {
            if (item.type === 'section') {
                if (currentGroup && currentGroup.items.length > 0) result.push(currentGroup);
                currentGroup = { section: item.label, items: [] };
            } else {
                if (!currentGroup) currentGroup = { items: [] };
                currentGroup.items.push(item);
            }
        }

        if (currentGroup && currentGroup.items.length > 0) result.push(currentGroup);
        return result;
    }, [filteredNavigation]);

    const isCollapsed = state === 'collapsed' && !isMobile;

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className={cn(
                "border-b border-sidebar-border bg-sidebar-accent/50 transition-all duration-200",
                isCollapsed ? "p-2" : "p-4"
            )}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <NavUser />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="overflow-y-auto">
                <div className="flex flex-col gap-0">
                    {groups.map((group, idx) => (
                        <SidebarGroup key={idx}>
                            {group.section && <SidebarGroupLabel>{group.section}</SidebarGroupLabel>}
                            <SidebarGroupContent>
                                <SidebarMenu className={cn(
                                    "gap-1 transition-all duration-200",
                                    isCollapsed ? "px-0 py-2" : "px-2 py-2"
                                )}>
                                    {group.items.map((item) => {
                                        if (item.type === 'group') return <NavGroupItem key={item.title} item={item} />;
                                        if (item.type === 'link') return <NavLinkItem key={item.href} item={item} />;
                                        return null;
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </div>
            </SidebarContent>

            <SidebarFooter className={cn(
                "border-t border-sidebar-border bg-sidebar-accent/5 transition-all duration-200",
                isCollapsed ? "p-2" : "p-4"
            )}>
                <AppLogo variant="sidebar" />
            </SidebarFooter>
        </Sidebar>
    );
}
