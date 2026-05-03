import React from "react";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { v } from "../../../styles/variables";

const EntityHeader = ({ 
    data, 
    theme, 
    isEditing, 
    handleEditPicture, 
    tempProfilePicture, 
    setOpenPreview 
}) => {
    const fullName = data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim();
    const createdAt = data.createdAt ? format(new Date(data.createdAt), "dd/MM/yyyy HH:mm") : "";
    const updatedAt = data.updatedAt ? format(new Date(data.updatedAt), "dd/MM/yyyy HH:mm") : "";

    const hasImages = data.Image && data.Image.length > 0;
    const avatarSrc = tempProfilePicture || (hasImages ? data.profilePicture : null);

    return (
        <div className="flex gap-6 mb-6">
            <div className="relative w-24 h-24">
                <div
                    className={`w-24 h-24 rounded-full overflow-hidden border shadow-inner ${hasImages ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{ borderColor: theme.bg4 }}
                    onClick={() => hasImages && setOpenPreview(true)}
                >
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt={fullName}
                            className="w-24 h-24 object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 flex items-center justify-center text-[10px] uppercase opacity-50 font-bold"
                             style={{ backgroundColor: theme.bg }}>
                            Sin foto
                        </div>
                    )}
                </div>
                
                {isEditing && (
                    <button
                        onClick={handleEditPicture}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full border shadow-lg z-20 hover:scale-110 transition-transform"
                        style={{
                            backgroundColor: v.colorPrincipal,
                            borderColor: v.colorPrincipal,
                            color: theme.bg1
                        }}
                    >
                        <Pencil size={14} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            <div className="flex flex-col w-full">
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold" style={{ color: theme.colortitlecard }}>
                        {fullName || "Detalle"}
                    </h1>
                </div>

                <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] opacity-50 font-mono tracking-tighter">ID: {data.id}</span>
                        {data.isActive !== undefined && (
                            <span className="inline-block px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider"
                                style={{
                                    backgroundColor: data.isActive ? theme.bg5 : theme.bg4,
                                    color: data.isActive ? "#fff" : theme.text,
                                }}>
                                {data.isActive ? "Activo" : "Inactivo"}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-col text-[10px] text-right opacity-40 font-medium">
                        <p>Creado: {createdAt}</p>
                        <p>Actualizado: {updatedAt}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntityHeader;
