// import { ref } from 'vue';
// import { analiseService } from '@/services/analiseService';
// import { monografiaService } from '@/services/monografiaService';
// import { cursoService } from '@/services/cursoService';
// import { docenteService } from '@/services/docenteService';
// import { estudanteService } from '@/services/estudanteService';
// import { documentoComparacaoService } from '@/services/documentoComparacaoService';

// export function useDashboard() {
//     const stats = ref({
//         total_estudantes: 0,
//         total_docentes: 0,
//         total_monografias: 0,
//         total_documentos_comparacao: 0,
//         monografias_analise: 0,
//         monografias_analisadas: 0,
//         monografias_submetidas: 0,
//         total_analises: 0,
//         analises_concluidas: 0,
//         analises_erro: 0,
//     });
//     const loading = ref(false);
//     const error = ref(null);

//     async function carregar() {
//         loading.value = true;
//         error.value = null;
//         try {
//             const [estudantes, docentes, monografias, analises, documentos] = await Promise.all([
//                 estudanteService.listar(),
//                 docenteService.listar(),
//                 monografiaService.listar(),
//                 analiseService.listar(),
//                 documentoComparacaoService.listar(),
//             ]);

//             const listaMono = monografias.data || monografias;
//             const listaAnalises = analises.data || analises;
//             const listaDocs = documentos.data || documentos;

//             stats.value = {
//                 total_estudantes: (estudantes.data || estudantes).length,
//                 total_docentes: (docentes.data || docentes).length,
//                 total_monografias: listaMono.length,
//                 total_documentos_comparacao: listaDocs.length,
//                 monografias_submetidas: listaMono.filter((m) => m.estado === 'SUBMETIDA').length,
//                 monografias_analise: listaMono.filter(
//                     (m) => m.estado === 'AGUARDANDO_ANALISE' || m.estado === 'EM_ANALISE'
//                 ).length,
//                 monografias_analisadas: listaMono.filter(
//                     (m) => m.estado === 'ANALISADA' || m.estado === 'RELATORIO_DISPONIVEL'
//                 ).length,
//                 total_analises: listaAnalises.length,
//                 analises_concluidas: listaAnalises.filter((a) => a.estado === 'CONCLUIDA').length,
//                 analises_erro: listaAnalises.filter((a) => a.estado === 'ERRO').length,
//             };
//             return { success: true, data: stats.value };
//         } catch (err) {
//             error.value = err.message || 'Erro ao carregar estatísticas.';
//             return { success: false, error: error.value };
//         } finally {
//             loading.value = false;
//         }
//     }

//     return { stats, loading, error, carregar };
// }

import { ref } from 'vue';
import { analiseService } from '@/services/analiseService';
import { monografiaService } from '@/services/monografiaService';
import { estudanteService } from '@/services/estudanteService';
import { docenteService } from '@/services/docenteService';
import { documentoComparacaoService } from '@/services/documentoComparacaoService';

export function useDashboard() {
    const stats = ref({
        total_estudantes: 0,
        total_docentes: 0,
        total_monografias: 0,
        total_documentos_comparacao: 0,
        monografias_analise: 0,
        monografias_analisadas: 0,
        monografias_submetidas: 0,
        total_analises: 0,
        analises_concluidas: 0,
        analises_erro: 0,
    });
    const analises = ref([]); // Lista crua para uso nos gráficos detalhados
    const loading = ref(false);
    const error = ref(null);

    async function carregar() {
        loading.value = true;
        error.value = null;
        try {
            const [estudantes, docentes, monografias, analisesResp, documentos] = await Promise.all([
                estudanteService.listar(),
                docenteService.listar(),
                monografiaService.listar(),
                analiseService.listar(),
                documentoComparacaoService.listar(),
            ]);

            const listaMono = monografias.data || monografias;
            const listaAnalises = analisesResp.data || analisesResp;
            const listaDocs = documentos.data || documentos;

            analises.value = Array.isArray(listaAnalises) ? listaAnalises : [];

            stats.value = {
                total_estudantes: (estudantes.data || estudantes).length,
                total_docentes: (docentes.data || docentes).length,
                total_monografias: listaMono.length,
                total_documentos_comparacao: listaDocs.length,
                monografias_submetidas: listaMono.filter((m) => m.estado === 'SUBMETIDA').length,
                monografias_analise: listaMono.filter(
                    (m) => m.estado === 'AGUARDANDO_ANALISE' || m.estado === 'EM_ANALISE'
                ).length,
                monografias_analisadas: listaMono.filter(
                    (m) => m.estado === 'ANALISADA' || m.estado === 'RELATORIO_DISPONIVEL'
                ).length,
                total_analises: listaAnalises.length,
                analises_concluidas: listaAnalises.filter((a) => a.estado === 'CONCLUIDA').length,
                analises_erro: listaAnalises.filter((a) => a.estado === 'ERRO').length,
            };
            return { success: true, data: stats.value };
        } catch (err) {
            error.value = err.message || 'Erro ao carregar estatísticas.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    return { stats, analises, loading, error, carregar };
}
