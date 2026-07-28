import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType, BorderStyle } from 'docx'

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

    const dataAtualizacao = format(new Date(report.dataAtualizacao), "dd/MM/yyyy HH:mm")
    const ambiente = report.ambiente === 'PRODUCAO' ? 'Producao' : 'Homologacao'
    const status = report.statusAtualizacao === 'SUCESSO' ? 'Sucesso' : report.statusAtualizacao === 'PARCIAL' ? 'Parcial' : 'Falha'

    const createCell = (text: string, bold: boolean = false, isHeader: boolean = false) => {
      return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold, font: "Arial", size: 20 })] })], // size 20 = 10pt
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        shading: isHeader ? { fill: "F0F0F0" } : undefined
      })
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Report de Atualizacao de Versao de Sistema",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Time: Time de Sustentacao ${report.tenant.nome}`, bold: true, size: 24 })
            ],
            spacing: { after: 400 }
          }),

          // Tabela 1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Campo", true, true), createCell("Informacao", true, true)] }),
              new TableRow({ children: [createCell("Sistema"), createCell(report.sistema)] }),
              new TableRow({ children: [createCell("Versao Anterior"), createCell(report.versaoAnterior)] }),
              new TableRow({ children: [createCell("Versao Atual"), createCell(report.versaoAtual)] }),
              new TableRow({ children: [createCell("Data/Hora da Atualizacao"), createCell(dataAtualizacao)] }),
              new TableRow({ children: [createCell("Ambiente"), createCell(ambiente)] }),
              new TableRow({ children: [createCell("Responsavel pela Atualizacao"), createCell(report.responsavel)] }),
              new TableRow({ children: [createCell("Status da Atualizacao"), createCell(status)] }),
            ]
          }),

          new Paragraph({
            text: "Indicadores Operacionais",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          // Tabela 2
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Indicador", true, true), createCell("Valor", true, true)] }),
              new TableRow({ children: [createCell("Atendimentos encerrados na versao anterior"), createCell(report.atendimentosEncerrados || '-')] }),
              new TableRow({ children: [createCell("Atendimentos abertos apos a entrada da nova versao"), createCell(report.atendimentosAbertos || '-')] }),
              new TableRow({ children: [createCell("Usuarios afetados por defeitos da versao"), createCell(report.usuariosAfetados || '-')] }),
              new TableRow({ children: [createCell("Quantidade de defeitos identificados"), createCell(report.defeitosIdentificados || '-')] }),
              new TableRow({ children: [createCell("Incidentes criticos"), createCell(report.incidentesCriticos || '-')] }),
              new TableRow({ children: [createCell("Incidentes de media/baixa criticidade"), createCell(report.incidentesMediaBaixa || '-')] }),
              new TableRow({ children: [createCell("Tempo total de indisponibilidade (se houver)"), createCell(report.tempoIndisponibilidade || '-')] }),
              new TableRow({ children: [createCell("Tempo para estabilizacao da versao"), createCell(report.tempoEstabilizacao || '-')] }),
            ]
          }),

          new Paragraph({
            text: "Observacoes",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({ children: [new TextRun({ text: "Principais melhorias entregues:", bold: true })] }),
          new Paragraph({ text: report.melhorias || 'Nenhuma informada.', spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Principais problemas identificados:", bold: true })] }),
          new Paragraph({ text: report.problemas || 'Nenhum informado.', spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Acoes em andamento:", bold: true })] }),
          new Paragraph({ text: report.acoesAndamento || 'Nenhuma informada.', spacing: { after: 200 } }),
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Report_${report.sistema}_${report.versaoAtual}.docx"`
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
