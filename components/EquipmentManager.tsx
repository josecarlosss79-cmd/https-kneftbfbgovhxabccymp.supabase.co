
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { EquipmentCategory, RiskClass, Equipment } from '../types';
import { useMaintenance } from '../context/MaintenanceContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { QrCode, Share2, Printer, X, Camera, FileText } from 'lucide-react';

const EquipmentManager: React.FC = () => {
  const { equipments, addEquipment, systemSettings } = useMaintenance();
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<Equipment | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    category: EquipmentCategory.DIAGNOSTICO,
    riskClass: RiskClass.CLASSE_I,
    location: '',
    manufacturer: ''
  });

  // Scanner logic
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScannerOpen) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render((decodedText) => {
        setFormData(prev => ({ ...prev, serialNumber: decodedText }));
        setIsScannerOpen(false);
        scanner?.clear();
      }, (error) => {
        // console.error(error);
      });
    }
    return () => {
      scanner?.clear();
    };
  }, [isScannerOpen]);

  // QR Code Generation logic - Enhanced with more details
  useEffect(() => {
    if (showQRModal) {
      const generateQR = async () => {
        try {
          // Conteúdo do QR Code enriquecido com detalhes do equipamento
          // Idealmente, um link para a "Digital Twin" do equipamento no sistema
          const baseUrl = window.location.origin + window.location.pathname;
          const url = `${baseUrl}#/equipments?id=${showQRModal.id}&sn=${showQRModal.serialNumber}&status=${showQRModal.status}&next=${showQRModal.nextMaintenance || 'N/D'}`;
          
          const qr = await QRCode.toDataURL(url, {
            width: 400,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#0f172a', // slate-900
              light: '#ffffff',
            },
          });
          setQrCodeDataUrl(qr);
        } catch (err) {
          console.error(err);
        }
      };
      generateQR();
    } else {
      setQrCodeDataUrl('');
    }
  }, [showQRModal]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addEquipment(formData);
    setShowModal(false);
    setFormData({
      name: '',
      serialNumber: '',
      category: EquipmentCategory.DIAGNOSTICO,
      riskClass: RiskClass.CLASSE_I,
      location: '',
      manufacturer: ''
    });
  };

  const exportQRToPDF = () => {
    if (!showQRModal || !qrCodeDataUrl) return;
    
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 100] // Formato de etiqueta 80x100mm
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(systemSettings.hospitalName, 40, 10, { align: 'center' });
    
    doc.addImage(qrCodeDataUrl, 'PNG', 15, 15, 50, 50);
    
    doc.setFontSize(9);
    doc.text(showQRModal.name, 40, 70, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${showQRModal.id}`, 10, 78);
    doc.text(`S/N: ${showQRModal.serialNumber}`, 10, 82);
    doc.text(`Local: ${showQRModal.location}`, 10, 86);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${showQRModal.status}`, 10, 92);
    doc.text(`Próx. Manut: ${showQRModal.nextMaintenance || 'N/D'}`, 10, 96);

    doc.save(`Etiqueta_${showQRModal.id}.pdf`);
  };

  // Direct Print functionality using a hidden window approach
  const handleDirectPrint = () => {
    if (!showQRModal || !qrCodeDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta MedMaintain - ${showQRModal.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              margin: 0; 
              padding: 20px;
              text-align: center;
              background: white;
            }
            .label-card {
              border: 1px solid #e2e8f0;
              padding: 24px;
              width: 320px;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .hospital-name { font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
            .qr-image { width: 180px; height: 180px; margin: 10px 0; }
            .equipment-name { font-weight: 700; font-size: 16px; margin-bottom: 4px; color: #0f172a; }
            .details { font-size: 11px; color: #64748b; margin-bottom: 2px; }
            .status-badge { 
              display: inline-block; 
              margin-top: 12px; 
              padding: 4px 12px; 
              background: #eff6ff; 
              color: #2563eb; 
              font-size: 10px; 
              font-weight: 700; 
              border-radius: 99px;
              text-transform: uppercase;
            }
            @media print {
              .label-card { box-shadow: none; border: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="hospital-name">${systemSettings.hospitalName}</div>
            <img src="${qrCodeDataUrl}" class="qr-image" />
            <div class="equipment-name">${showQRModal.name}</div>
            <div class="details">Patrimônio: <strong>${showQRModal.id}</strong></div>
            <div class="details">Nº de Série: ${showQRModal.serialNumber}</div>
            <div class="details">Setor: ${showQRModal.location}</div>
            <div class="status-badge">${showQRModal.status}</div>
            <div class="details" style="margin-top: 8px;">Próxima Manutenção: <strong>${showQRModal.nextMaintenance || 'N/D'}</strong></div>
          </div>
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print(); 
                window.close(); 
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareViaWhatsApp = () => {
    if (!showQRModal) return;
    const text = `*Ficha de Equipamento - ${systemSettings.hospitalName}*\n\n` +
                 `📦 *Ativo:* ${showQRModal.name}\n` +
                 `🆔 *ID:* ${showQRModal.id}\n` +
                 `🔢 *S/N:* ${showQRModal.serialNumber}\n` +
                 `📍 *Local:* ${showQRModal.location}\n` +
                 `⚡ *Status:* ${showQRModal.status}\n` +
                 `📅 *Próx. Manut.:* ${showQRModal.nextMaintenance || 'N/D'}\n\n` +
                 `Consulte os detalhes escaneando a etiqueta no ativo.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Inventário de Ativos</h2>
          <p className="text-slate-500">Gestão completa de dispositivos médicos ({equipments.length} ativos).</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          {ICONS.Add} ADICIONAR EQUIPAMENTO
        </button>
      </header>

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 items-center ${systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {ICONS.Search}
          </span>
          <input 
            type="text" 
            placeholder="Buscar por nome, patrimônio ou fabricante..." 
            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
              systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Equipment Table */}
      <div className={`rounded-3xl border shadow-sm overflow-hidden ${systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b ${systemSettings.highContrastMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                <th className="px-6 py-4">ID / Nome</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Etiqueta QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {equipments.filter(eq => eq.name.toLowerCase().includes(search.toLowerCase()) || eq.id.toLowerCase().includes(search.toLowerCase())).map((eq) => (
                <tr key={eq.id} className={`transition-colors group ${systemSettings.highContrastMode ? 'hover:bg-slate-800/40 text-slate-300 divide-slate-800' : 'hover:bg-slate-50/80 text-slate-700 divide-slate-100'}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] border border-blue-100 uppercase flex-shrink-0">
                        {eq.id.split('-')[1]}
                      </div>
                      <div className="truncate max-w-[150px] md:max-w-none">
                        <p className="font-bold truncate">{eq.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{eq.serialNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${systemSettings.highContrastMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {eq.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-medium">{eq.location}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      eq.status === 'Operacional' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => setShowQRModal(eq)}
                      className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      <QrCode size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {equipments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 italic">
                    Nenhum ativo em base. Use o botão superior para cadastrar ou importar dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border flex flex-col max-h-[90vh] ${
            systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`p-6 border-b flex items-center justify-between ${systemSettings.highContrastMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h3 className={`text-xl font-bold ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Novo Ativo Hospitalar</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl text-slate-400 hover:text-rose-500">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Ativo</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                    placeholder="Ex: Monitor GE B450" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Serial Number / Patrimônio</label>
                    <button 
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      <Camera size={12} /> SCAN QR
                    </button>
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={formData.serialNumber} 
                    onChange={e => setFormData({...formData, serialNumber: e.target.value})} 
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                    placeholder="SN-2024-XXXX" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value as any})} 
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white cursor-pointer ${
                      systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    {Object.values(EquipmentCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Setor / Localização</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                    placeholder="Ex: UTI Adulto" 
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Fabricante</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.manufacturer} 
                    onChange={e => setFormData({...formData, manufacturer: e.target.value})} 
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                    placeholder="Ex: GE Healthcare" 
                  />
                </div>
              </div>

              {isScannerOpen && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-blue-600">Scanner de QR Code</h4>
                    <button 
                      type="button" 
                      onClick={() => setIsScannerOpen(false)}
                      className="text-rose-500 font-bold text-xs"
                    >
                      FECHAR SCANNER
                    </button>
                  </div>
                  <div id="qr-reader" className="w-full bg-slate-900 rounded-3xl overflow-hidden shadow-inner"></div>
                  <p className="text-[10px] text-slate-400 text-center italic">Aponte a câmera para o QR Code da etiqueta do fabricante.</p>
                </div>
              )}
              
              <div className="pt-10 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={`flex-1 py-4 font-bold text-xs transition-all ${systemSettings.highContrastMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:bg-slate-50 rounded-2xl'}`}
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  SALVAR ATIVO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Display Modal - Enhanced with direct print and more info */}
      {showQRModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border ${
            systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`p-8 border-b flex items-center justify-between ${systemSettings.highContrastMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
              <div>
                <h3 className={`text-xl font-bold ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Etiqueta Digital</h3>
                <p className="text-xs text-slate-400 font-medium">{showQRModal.name}</p>
              </div>
              <button 
                onClick={() => setShowQRModal(null)} 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors text-2xl ${
                  systemSettings.highContrastMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'
                }`}
              >
                &times;
              </button>
            </div>

            <div className="p-10 flex flex-col items-center space-y-6">
              <div className={`p-6 bg-white rounded-[2.5rem] shadow-xl border-4 ${systemSettings.highContrastMode ? 'border-blue-900' : 'border-blue-50'}`}>
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 block" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-3xl animate-pulse">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gerando...</span>
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className={`text-sm font-bold uppercase tracking-[0.2em] ${systemSettings.highContrastMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {showQRModal.id}
                </p>
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    showQRModal.status === 'Operacional' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    STATUS: {showQRModal.status}
                  </span>
                  <p className={`text-[10px] font-medium ${systemSettings.highContrastMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Próxima Manutenção: <span className="font-bold">{showQRModal.nextMaintenance || 'N/D'}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full pt-4">
                <button 
                  onClick={handleDirectPrint}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border transition-all active:scale-95 group ${
                    systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}
                >
                  <Printer size={20} className="text-slate-700" />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${systemSettings.highContrastMode ? 'text-slate-300' : 'text-slate-600'}`}>Imprimir</span>
                </button>
                <button 
                  onClick={exportQRToPDF}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border transition-all active:scale-95 group ${
                    systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}
                >
                  <FileText size={20} className="text-blue-500" />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${systemSettings.highContrastMode ? 'text-slate-300' : 'text-slate-600'}`}>PDF</span>
                </button>
                <button 
                  onClick={shareViaWhatsApp}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border transition-all active:scale-95 group ${
                    systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}
                >
                  <Share2 size={20} className="text-emerald-500" />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${systemSettings.highContrastMode ? 'text-slate-300' : 'text-slate-600'}`}>WhatsApp</span>
                </button>
              </div>
            </div>

            <div className={`p-6 border-t text-center ${systemSettings.highContrastMode ? 'bg-slate-800/50 border-slate-800 text-slate-500' : 'bg-slate-50/50 border-slate-100 text-slate-400'}`}>
               <p className="text-[9px] font-bold uppercase tracking-widest italic">Padrão de Segurança MedMaintain v2.5</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManager;
