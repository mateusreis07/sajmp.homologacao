import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const report = await prisma.versionReport.findUnique({
      where: { id: parseInt(id) },
      include: { tenant: true }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const doc = new jsPDF()

    // Title
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Report de Atualizacao de Versao de Sistema", 14, 20)

    // Subtitle
    doc.setFontSize(12)
    doc.text(`Time: Time de Sustentacao ${report.tenant.nome}`, 14, 28)

    // Format data
    const dataAtualizacao = format(new Date(report.dataAtualizacao), "dd/MM/yyyy HH:mm")
    const ambiente = report.ambiente === 'PRODUCAO' ? 'Producao' : 'Homologacao'
    const status = report.statusAtualizacao === 'SUCESSO' ? 'Sucesso' : report.statusAtualizacao === 'PARCIAL' ? 'Parcial' : 'Falha'

    // Table 1: Dados
    autoTable(doc, {
      startY: 35,
      head: [['Campo', 'Informacao']],
      body: [
        ['Sistema', report.sistema],
        ['Versao Anterior', report.versaoAnterior],
        ['Versao Atual', report.versaoAtual],
        ['Data/Hora da Atualizacao', dataAtualizacao],
        ['Ambiente', ambiente],
        ['Responsavel pela Atualizacao', report.responsavel],
        ['Status da Atualizacao', status],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 10 }
    })

    // @ts-ignore
    let currentY = doc.lastAutoTable.finalY + 15

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Indicadores Operacionais", 14, currentY)

    // Table 2: Indicadores
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Indicador', 'Valor']],
      body: [
        ['Atendimentos encerrados na versao anterior', report.atendimentosEncerrados || '-'],
        ['Atendimentos abertos apos a entrada da nova versao', report.atendimentosAbertos || '-'],
        ['Usuarios afetados por defeitos da versao', report.usuariosAfetados || '-'],
        ['Quantidade de defeitos identificados', report.defeitosIdentificados || '-'],
        ['Incidentes criticos', report.incidentesCriticos || '-'],
        ['Incidentes de media/baixa criticidade', report.incidentesMediaBaixa || '-'],
        ['Tempo total de indisponibilidade (se houver)', report.tempoIndisponibilidade || '-'],
        ['Tempo para estabilizacao da versao', report.tempoEstabilizacao || '-'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 10 }
    })

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Observacoes", 14, currentY)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    currentY += 8
    
    const writeSection = (title: string, text: string, y: number) => {
       doc.setFont("helvetica", "bold")
       doc.text(`- ${title}:`, 14, y)
       doc.setFont("helvetica", "normal")
       const lines = doc.splitTextToSize(text || 'Nenhuma informada.', 170)
       doc.text(lines, 20, y + 6)
       return y + 6 + (lines.length * 5)
    }

    currentY = writeSection("Principais melhorias entregues", report.melhorias, currentY) + 5
    currentY = writeSection("Principais problemas identificados", report.problemas, currentY) + 5
    currentY = writeSection("Acoes em andamento", report.acoesAndamento, currentY) + 5

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Report_${report.sistema}_${report.versaoAtual}.pdf"`
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
