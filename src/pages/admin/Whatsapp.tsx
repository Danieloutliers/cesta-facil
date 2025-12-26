import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
// ... (imports)

// ... (logic)

// ... (jsx)
<div className="flex gap-2">
    <Button variant="outline" onClick={checkStatus} disabled={loading} className="flex-1">
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Atualizar Status
    </Button>


    {status?.ready && (
        <Button variant="destructive" onClick={handleDisconnect} disabled={loading} className="flex-1">
            <LogOut className="h-4 w-4 mr-2" />
            Desconectar
        </Button>
    )}
</div>
                    </CardContent >
                </Card >

    {/* QR Code Card */ }
    < Card >
                    <CardHeader>
                        <CardTitle>QR Code</CardTitle>
                        <CardDescription>Use seu celular para escanear.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6 min-h-[300px]">
                        {status?.qr ? (
                            <div className="p-4 bg-white rounded-lg shadow-sm border">
                                <QRCodeSVG value={status.qr} size={256} />
                            </div>
                        ) : status?.ready ? (
                            <div className="flex flex-col items-center gap-4 text-green-600">
                                <CheckCircle2 className="h-16 w-16" />
                                <p className="font-semibold">Sincronizado</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <XCircle className="h-16 w-16" />
                                <p>Servidor desligado</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <RefreshCw className="h-16 w-16 animate-spin" />
                                <p>Aguardando QR Code...</p>
                            </div>
                        )}
                    </CardContent>
                </Card >
            </div >
        </div >
    );
}
