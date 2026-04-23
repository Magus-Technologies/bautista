import { QRCodeSVG } from 'qrcode.react';

interface Configuration {
    primary_color: string;
    secondary_color: string;
    text_color: string;
    logo_path?: string;
    footer_text: string;
}

interface User {
    id: number;
    name: string;
    rol_name?: string;
    avatar?: string;
    isDocente?: boolean;  // Nueva propiedad para identificar docentes
    details?: {
        student_id?: string;
        dni?: string;
        grado?: string;
        nivel?: string;
        seccion?: string;
        especialidad?: string;  // Para docentes
        tel?: string;
    };
}

interface Props {
    user: User;
    config: Configuration;
    className?: string;
}

export default function FotocheckCardPreview({ user, config, className }: Props) {
    const primaryColor = config.primary_color || '#2c63f2';
    const secondaryColor = config.secondary_color || '#7b8780';
    const textColor = config.text_color || '#ffffff';

    return (
        <div 
            className={`w-[54mm] h-[85.6mm] bg-white shadow-2xl rounded-sm overflow-hidden flex flex-col font-sans border-[0.6mm] border-black ${className || ''}`}
        >
            
            {/* Header: Exact 18mm height */}
            <div className="h-[18mm] flex flex-col items-center p-0 bg-white relative z-10 border-b border-gray-100">
                {/* Logo: Engrandece de 16x8 a 22x10mm approx */}
                <div className="w-[30mm] h-[11mm] mt-[1.5mm] flex items-center justify-center overflow-hidden">
                    {config.logo_path ? (
                        <img 
                            src={config.logo_path.startsWith('http') || config.logo_path.startsWith('/storage/') ? config.logo_path : `/storage/${config.logo_path}`} 
                            className="h-full w-auto object-contain" 
                            alt="Logo" 
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-blue-800 flex items-center justify-center">
                            <span className="text-blue-800 font-black text-[8px]">LOGO</span>
                        </div>
                    )}
                </div>
                {/* Institution Name: Helvetica Bold 5pt */}
                <div className="text-[5.2pt] font-black text-[#1E1E1E] tracking-tight uppercase text-center w-full mt-[1.2mm] px-2 leading-none">
                    IEP BAUTISTA LA PASCANA
                </div>
                {/* Fotocheck label REMOVED as requested */}
            </div>

            {/* Body: Main Color Area */}
            <div 
                className="flex-1 flex flex-col items-center p-0 relative"
                style={{ backgroundColor: secondaryColor }}
            >
                {/* Photo Frame: 32mm x 32mm */}
                <div className="w-[32mm] h-[32mm] bg-white p-[0.6mm] border-[0.25mm] border-[#C8C8C8] overflow-hidden mt-[4mm]">
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                            <img 
                                src={user.avatar.startsWith('http') || user.avatar.startsWith('/storage/') ? user.avatar : `/storage/${user.avatar}`} 
                                className="w-full h-full object-cover" 
                                alt="Avatar" 
                            />
                        ) : (
                            <img 
                                src="https://ui-avatars.com/api/?name=User&background=f3f4f6&color=d1d5db&size=150" 
                                className="w-full h-full object-cover opacity-50" 
                                alt="No Photo" 
                            />
                        )}
                    </div>
                </div>

                {/* Info Area: Dynamic Background Color */}
                <div 
                    className="w-[50mm] h-[27mm] border-[0.2mm] border-[#1E1E1E]/30 flex flex-col items-center mt-[2mm] relative z-10" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderColor: textColor }}
                >
                    
                    {/* User Name */}
                    <div className="w-full text-center mt-[1.5mm]">
                        <h3 
                            className="text-[6.2pt] font-black leading-tight uppercase px-1"
                            style={{ color: textColor }}
                        >
                            {user.name}
                        </h3>
                    </div>

                    {/* Role Label: Dynamic Color */}
                    <div 
                        className="w-[24mm] h-[2.8mm] flex items-center justify-center mt-[1.2mm] shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <span className="text-white text-[4pt] font-black uppercase tracking-[0.15em]">
                            {user.rol_name === 'ESTUDIANTE' ? 'ALUMNO(A)' : user.rol_name || 'MIEMBRO'}
                        </span>
                    </div>

                    {/* QR and Metadata Grid */}
                    <div className="w-full flex mt-[1.7mm] px-[2.5mm]">
                        {/* QR: 10mm x 10mm */}
                        <div className="w-[10mm] h-[10mm] bg-white p-[0.5mm] shadow-sm">
                            <QRCodeSVG 
                                value={user.id.toString()} 
                                size={36}
                                level="M" 
                                includeMargin={false}
                            />
                        </div>

                        {/* Metadata: Dynamic Text Color */}
                        <div 
                            className="flex-1 flex flex-col pl-[2mm] text-[3.8pt] leading-none"
                            style={{ color: textColor }}
                        >
                            <div className="flex mb-[0.65mm]">
                                <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">ID:</span>
                                <span className="font-bold truncate">{user.details?.student_id || ('EST-' + user.id.toString().padStart(6, '0'))}</span>
                            </div>
                            <div className="flex mb-[0.65mm]">
                                <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">DNI:</span>
                                <span className="font-bold">{user.details?.dni || '—'}</span>
                            </div>
                            
                            {/* Mostrar campos diferentes para docentes */}
                            {user.isDocente || user.rol_name === 'DOCENTE' ? (
                                <>
                                    {user.details?.especialidad && (
                                        <div className="flex mb-[0.65mm]">
                                            <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">ESPECIALIDAD:</span>
                                            <span className="font-bold">{user.details.especialidad}</span>
                                        </div>
                                    )}
                                    <div className="flex">
                                        <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">TEL:</span>
                                        <span className="font-bold">{user.details?.tel || '—'}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex mb-[0.65mm]">
                                        <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">GRADO:</span>
                                        <span className="font-bold">{user.details?.grado || '—'}</span>
                                    </div>
                                    <div className="flex mb-[0.65mm]">
                                        <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">NIVEL:</span>
                                        <span className="font-bold">{user.details?.nivel || '—'}</span>
                                    </div>
                                    <div className="flex mb-[0.65mm]">
                                        <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">SEC:</span>
                                        <span className="font-bold">{user.details?.seccion || 'UNICA'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-[16mm] font-black uppercase tracking-tighter opacity-90">TEL:</span>
                                        <span className="font-bold">{user.details?.tel || '—'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: Dynamic Color */}
                <div 
                    className="absolute bottom-0 w-full h-[3.8mm] flex items-center justify-center z-20"
                    style={{ backgroundColor: primaryColor }}
                >
                    <span className="text-white text-[4.2pt] font-black uppercase tracking-[0.1em]">
                        {config.footer_text || 'Periodo Institucional 2026'}
                    </span>
                </div>
            </div>
        </div>
    );
}
