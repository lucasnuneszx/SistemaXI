'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface Atividade {
  id: string;
  nome: string;
  status: string;
  descricao?: string;
}

interface FormData {
  data_referente: string;
  outras_atividades: string;
  atividades_realizadas_ids: string[];
  valor_investido: string;
  leads: string;
  custo_por_lead: string;
  registros: string;
  custo_por_registro: string;
  deposito: string;
  ftd: string;
  custo_por_ftd: string;
  valor_ftd: string;
  cpa: string;
  comissao_cpa: string;
  revshare: string;
  total_comissao_dia: string;
  observacoes: string;
}

export default function NewRelatorioPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projeto, setProjeto] = useState<{ nome: string } | null>(null);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loadingAtividades, setLoadingAtividades] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    data_referente: new Date().toISOString().split('T')[0],
    outras_atividades: '',
    atividades_realizadas_ids: [],
    valor_investido: '',
    leads: '',
    custo_por_lead: '',
    registros: '',
    custo_por_registro: '',
    deposito: '',
    ftd: '',
    custo_por_ftd: '',
    valor_ftd: '',
    cpa: '',
    comissao_cpa: '',
    revshare: '',
    total_comissao_dia: '',
    observacoes: ''
  });

  useEffect(() => {
    const fetchDados = async () => {
      setLoadingAtividades(true);
      try {

        const projetoResponse = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (projetoResponse.ok) {
          const projetoData = await projetoResponse.json();
          setProjeto(projetoData);
        } else {
          console.error('Erro ao buscar projeto:', projetoResponse.status, projetoResponse.statusText);
        }

        const atividadesUrl = `${buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES)}/projeto/${projectId}`;
        
        const atividadesResponse = await fetch(atividadesUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (atividadesResponse.ok) {
          const atividadesData = await atividadesResponse.json();
          setAtividades(atividadesData);
        } else {
          const errorText = await atividadesResponse.text();
          console.error('Erro ao buscar atividades:', atividadesResponse.status, atividadesResponse.statusText);
          console.error('Detalhes do erro:', errorText);
        }

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoadingAtividades(false);
      }
    };

    if (token && projectId) {
      fetchDados();
    }
  }, [token, projectId]);

  // Auto-calcular métricas quando possível
  useEffect(() => {
    const valorInvestido = parseFloat(formData.valor_investido) || 0;
    const leads = parseInt(formData.leads) || 0;
    const registros = parseInt(formData.registros) || 0;
    const ftd = parseInt(formData.ftd) || 0;

    if (valorInvestido > 0 && leads > 0) {
      const custoPorLead = (valorInvestido / leads).toFixed(2);
      setFormData(prev => ({ ...prev, custo_por_lead: custoPorLead }));
    }

    if (valorInvestido > 0 && registros > 0) {
      const custoPorRegistro = (valorInvestido / registros).toFixed(2);
      setFormData(prev => ({ ...prev, custo_por_registro: custoPorRegistro }));
    }

    if (valorInvestido > 0 && ftd > 0) {
      const custoPorFtd = (valorInvestido / ftd).toFixed(2);
      setFormData(prev => ({ ...prev, custo_por_ftd: custoPorFtd }));
    }

    const comissaoCpa = parseFloat(formData.comissao_cpa) || 0;
    const revshare = parseFloat(formData.revshare) || 0;
    const totalComissao = comissaoCpa + revshare;
    
    // Sempre calcular, mesmo que seja 0 ou negativo
    setFormData(prev => ({ ...prev, total_comissao_dia: totalComissao.toFixed(2) }));
    
  }, [formData.valor_investido, formData.leads, formData.registros, formData.ftd, formData.comissao_cpa, formData.revshare]);

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.data_referente) {
      setError('Data de referência é obrigatória');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        projeto_id: projectId,
        data_referente: formData.data_referente,
        criacao_criativos: false, // Mantendo por compatibilidade com backend
        identidade_visual: false, // Mantendo por compatibilidade com backend
        outras_atividades: formData.outras_atividades || null,
        atividades_realizadas_ids: formData.atividades_realizadas_ids.length > 0 ? formData.atividades_realizadas_ids : null,
        valor_investido: formData.valor_investido ? parseFloat(formData.valor_investido) : null,
        leads: formData.leads ? parseInt(formData.leads) : null,
        custo_por_lead: formData.custo_por_lead ? parseFloat(formData.custo_por_lead) : null,
        registros: formData.registros ? parseInt(formData.registros) : null,
        custo_por_registro: formData.custo_por_registro ? parseFloat(formData.custo_por_registro) : null,
        deposito: formData.deposito ? parseFloat(formData.deposito) : null,
        ftd: formData.ftd ? parseInt(formData.ftd) : null,
        custo_por_ftd: formData.custo_por_ftd ? parseFloat(formData.custo_por_ftd) : null,
        valor_ftd: formData.valor_ftd ? parseFloat(formData.valor_ftd) : null,
        cpa: formData.cpa ? parseInt(formData.cpa) : null,
        comissao_cpa: formData.comissao_cpa ? parseFloat(formData.comissao_cpa) : null,
        revshare: formData.revshare ? parseFloat(formData.revshare) : null,
        total_comissao_dia: formData.total_comissao_dia ? parseFloat(formData.total_comissao_dia) : null,
        observacoes: formData.observacoes || null
      };

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao criar relatório');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/projects/${projectId}/relatorios-diarios`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluída': return 'default';
      case 'em andamento': return 'secondary';
      case 'atrasada': return 'destructive';
      default: return 'outline';
    }
  };

  if (success) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Relatório criado com sucesso!
            </h2>
            <p className="text-muted-foreground mb-4">
              Redirecionando para a lista de relatórios...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">📊 Novo Relatório Diário</h1>
          <p className="text-muted-foreground mt-1">
            {projeto?.nome || ''} - Preencha os dados do dia
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Data e Atividades */}
        <Card>
          <CardHeader>
            <CardTitle>Data e Atividades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="data_referente">Data Referente *</Label>
              <Input
                id="data_referente"
                type="date"
                value={formData.data_referente}
                onChange={(e) => handleInputChange('data_referente', e.target.value)}
                required
              />
            </div>

            {/* Atividades do Projeto */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                📋 Atividades do Projeto Realizadas
              </Label>
              
              {loadingAtividades ? (
                <div className="text-sm text-muted-foreground">
                  Carregando atividades...
                </div>
              ) : atividades.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {atividades.map((atividade) => (
                    <div key={atividade.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox
                        id={`atividade-${atividade.id}`}
                        checked={formData.atividades_realizadas_ids.includes(atividade.id)}
                        onCheckedChange={(checked) => {
                          const ids = formData.atividades_realizadas_ids;
                          if (checked) {
                            handleInputChange('atividades_realizadas_ids', [...ids, atividade.id]);
                          } else {
                            handleInputChange('atividades_realizadas_ids', ids.filter(id => id !== atividade.id));
                          }
                        }}
                      />
                      <Label htmlFor={`atividade-${atividade.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{atividade.nome}</span>
                          <Badge variant={getStatusBadgeVariant(atividade.status)}>
                            {atividade.status}
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
                  ℹ️ Nenhuma atividade encontrada para este projeto. 
                  <br />
                  Você pode criar atividades na página do projeto primeiro.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="outras_atividades">Outras Atividades</Label>
              <Textarea
                id="outras_atividades"
                value={formData.outras_atividades}
                onChange={(e) => handleInputChange('outras_atividades', e.target.value)}
                rows={3}
                placeholder="Descreva outras atividades realizadas no dia..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Investimento e Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Investimento e Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="valor_investido">Valor Investido (R$)</Label>
                <Input
                  id="valor_investido"
                  type="number"
                  step="0.01"
                  value={formData.valor_investido}
                  onChange={(e) => handleInputChange('valor_investido', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leads">Leads</Label>
                <Input
                  id="leads"
                  type="number"
                  value={formData.leads}
                  onChange={(e) => handleInputChange('leads', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo_por_lead">Custo por Lead (R$) <span className="text-muted-foreground">(auto)</span></Label>
                <Input
                  id="custo_por_lead"
                  type="number"
                  step="0.01"
                  value={formData.custo_por_lead}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registros">Registros</Label>
                <Input
                  id="registros"
                  type="number"
                  value={formData.registros}
                  onChange={(e) => handleInputChange('registros', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo_por_registro">Custo por Registro (R$) <span className="text-muted-foreground">(auto)</span></Label>
                <Input
                  id="custo_por_registro"
                  type="number"
                  step="0.01"
                  value={formData.custo_por_registro}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposito">Depósito (R$)</Label>
                <Input
                  id="deposito"
                  type="number"
                  step="0.01"
                  value={formData.deposito}
                  onChange={(e) => handleInputChange('deposito', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de FTD e CPA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              FTD e Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ftd">FTD</Label>
                <Input
                  id="ftd"
                  type="number"
                  value={formData.ftd}
                  onChange={(e) => handleInputChange('ftd', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo_por_ftd">Custo por FTD (R$) <span className="text-muted-foreground">(auto)</span></Label>
                <Input
                  id="custo_por_ftd"
                  type="number"
                  step="0.01"
                  value={formData.custo_por_ftd}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_ftd">Valor de FTD (R$)</Label>
                <Input
                  id="valor_ftd"
                  type="number"
                  step="0.01"
                  value={formData.valor_ftd}
                  onChange={(e) => handleInputChange('valor_ftd', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpa">CPA</Label>
                <Input
                  id="cpa"
                  type="number"
                  value={formData.cpa}
                  onChange={(e) => handleInputChange('cpa', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comissao_cpa">Comissão CPA (R$)</Label>
                <Input
                  id="comissao_cpa"
                  type="number"
                  step="0.01"
                  value={formData.comissao_cpa}
                  onChange={(e) => handleInputChange('comissao_cpa', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revshare">Revshare (R$)</Label>
                <Input
                  id="revshare"
                  type="number"
                  step="0.01"
                  value={formData.revshare}
                  onChange={(e) => handleInputChange('revshare', e.target.value)}
                  placeholder="Valor pode ser negativo"
                />
              </div>
            </div>

            <div className="mt-6">
              <Card className={`border-2 ${parseFloat(formData.total_comissao_dia) >= 0 ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}>
                <CardContent className="p-4">
                  <Label htmlFor="total_comissao_dia" className="text-base font-medium">
                    Total de Comissão do Dia (R$) <span className="text-muted-foreground">(auto)</span>
                  </Label>
                  <Input
                    id="total_comissao_dia"
                    type="number"
                    step="0.01"
                    value={formData.total_comissao_dia}
                    readOnly
                    className={`mt-2 text-lg font-semibold bg-white dark:bg-transparent ${
                      parseFloat(formData.total_comissao_dia) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  />
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações Gerais</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={4}
                placeholder="Adicione observações sobre o desempenho do dia, insights, melhorias, etc..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-red-800">❌ {error}</div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Salvando...' : 'Salvar Relatório'}
          </Button>
        </div>
      </form>
    </div>
  );
} 