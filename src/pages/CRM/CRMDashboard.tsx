import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Send,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Star,
  ArrowUpRight,
  BarChart3,
  UserPlus,
  Zap,
  CircleDollarSign,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface DashboardData {
  leadStats: {
    total_leads: number;
    lead_count: number;
    mql_count: number;
    sql_count: number;
    opportunity_count: number;
    customer_count: number;
    lost_count: number;
    avg_score: number;
    total_pipeline_value: number;
    qualified_count: number;
    unqualified_count: number;
  };
  recentLeads: any[];
  activeCampaigns: any[];
}

const STAGE_COLORS: Record<string, string> = {
  lead: 'from-slate-500 to-slate-600',
  mql: 'from-blue-500 to-blue-600',
  sql: 'from-purple-500 to-purple-600',
  opportunity: 'from-amber-500 to-amber-600',
  customer: 'from-green-500 to-green-600',
  lost: 'from-red-500 to-red-600',
};

const STAGE_BG_COLORS: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  mql: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  sql: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  opportunity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  customer: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

export default function CRMDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [leadStatsRes, recentLeadsRes, campaignsRes] = await Promise.all([
        axios.get('/api/v1/leads/stats', { headers }),
        axios.get('/api/v1/leads/', { headers, params: { limit: 5 } }),
        axios.get('/api/v1/campaigns/active', { headers, params: { limit: 5 } }).catch(() => ({ data: [] })),
      ]);

      setData({
        leadStats: leadStatsRes.data,
        recentLeads: recentLeadsRes.data,
        activeCampaigns: campaignsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const conversionRate =
    data.leadStats.total_leads > 0
      ? (((data.leadStats.customer_count || 0) / data.leadStats.total_leads) * 100).toFixed(1)
      : 0;

  const metrics = [
    {
      title: t('crm.dashboard.stats.totalLeads'),
      value: data.leadStats.total_leads,
      subtext: `${data.leadStats.qualified_count || 0} ${t('crm.leads.qualification.qualified').toLowerCase()}`,
      icon: Users,
      gradient: 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: t('crm.dashboard.stats.pipelineValue'),
      value: `$${(data.leadStats.total_pipeline_value || 0).toLocaleString()}`,
      subtext: `${data.leadStats.opportunity_count} ${t('crm.leads.stages.opportunity').toLowerCase()}`,
      icon: CircleDollarSign,
      gradient: 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50',
      iconColor: 'text-green-600 dark:text-green-400',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: t('crm.dashboard.stats.conversionRate'),
      value: `${conversionRate}%`,
      subtext: `${data.leadStats.customer_count} ${t('crm.dashboard.customersWon')}`,
      icon: Percent,
      gradient: 'from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trend: '+2.3%',
      trendUp: true,
    },
    {
      title: t('crm.leads.stats.avgScore'),
      value: `${data.leadStats.avg_score ? data.leadStats.avg_score.toFixed(0) : 0}/100`,
      subtext: t('crm.leads.fields.score'),
      icon: Star,
      gradient: 'from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      trend: '+5',
      trendUp: true,
    },
  ];

  const pipelineStages = [
    { stage: 'lead', label: t('crm.leads.stages.new'), count: data.leadStats.lead_count || 0 },
    { stage: 'mql', label: 'MQL', count: data.leadStats.mql_count || 0 },
    { stage: 'sql', label: 'SQL', count: data.leadStats.sql_count || 0 },
    { stage: 'opportunity', label: t('crm.leads.stages.opportunity'), count: data.leadStats.opportunity_count || 0 },
    { stage: 'customer', label: t('crm.leads.stages.customer'), count: data.leadStats.customer_count || 0 },
    { stage: 'lost', label: t('crm.leads.stages.lost'), count: data.leadStats.lost_count || 0 },
  ];

  const quickActions = [
    {
      title: t('crm.contacts.title'),
      description: t('crm.dashboard.quickActions.contactsDesc'),
      icon: Users,
      path: '/dashboard/crm/contacts',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: t('crm.leads.title'),
      description: t('crm.dashboard.quickActions.leadsDesc'),
      icon: UserPlus,
      path: '/dashboard/crm/leads',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: t('crm.campaigns.title'),
      description: t('crm.dashboard.quickActions.campaignsDesc'),
      icon: Send,
      path: '/dashboard/crm/campaigns',
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      title: t('crm.dashboard.quickActions.analytics'),
      description: t('crm.dashboard.quickActions.analyticsDesc'),
      icon: BarChart3,
      path: '/dashboard/crm/analytics',
      gradient: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          {t('crm.dashboard.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('crm.dashboard.subtitle')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-sm`}>
                    <IconComponent className={`h-6 w-6 ${metric.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.trendUp ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${metric.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold dark:text-white mb-1">{metric.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{metric.subtext}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales Pipeline */}
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold dark:text-white">{t('crm.dashboard.pipelineOverview')}</CardTitle>
          <CardDescription className="dark:text-gray-400">{t('crm.dashboard.pipelineDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {pipelineStages.map((item) => (
              <div
                key={item.stage}
                className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                onClick={() => navigate(`/dashboard/crm/leads?stage=${item.stage}`)}
              >
                <div className="text-3xl font-bold dark:text-white mb-1">{item.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.label}</div>
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${STAGE_COLORS[item.stage]}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold dark:text-white">{t('crm.dashboard.recentLeads')}</CardTitle>
                <CardDescription className="dark:text-gray-400">{t('crm.dashboard.recentLeadsDesc')}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/crm/leads')}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                {t('crm.common.showMore')}
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentLeads.slice(0, 5).map((lead: any) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                  onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {lead.contact?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium dark:text-white">{lead.contact?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{lead.contact?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">{lead.score}</span>
                    </div>
                    <Badge className={cn("border-0 text-xs", STAGE_BG_COLORS[lead.stage])}>
                      {lead.stage.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.recentLeads.length === 0 && (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{t('crm.leads.noLeads')}</p>
                  <Button
                    variant="link"
                    className="mt-1 text-orange-600"
                    onClick={() => navigate('/dashboard/crm/leads')}
                  >
                    {t('crm.leads.noLeadsMessage')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold dark:text-white">{t('crm.dashboard.activeCampaigns')}</CardTitle>
                <CardDescription className="dark:text-gray-400">{t('crm.dashboard.activeCampaignsDesc')}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/crm/campaigns')}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                {t('crm.common.showMore')}
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.activeCampaigns.map((campaign: any) => {
                const progress = campaign.total_contacts > 0
                  ? (campaign.contacts_reached / campaign.total_contacts) * 100
                  : 0;
                return (
                  <div
                    key={campaign.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                    onClick={() => navigate(`/dashboard/crm/campaigns/${campaign.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium dark:text-white">{campaign.name}</div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                        {t('crm.campaigns.status.active')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.progress')}</span>
                        <span className="font-medium dark:text-white">
                          {campaign.contacts_reached}/{campaign.total_contacts}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={progress} className="h-2 bg-slate-200 dark:bg-slate-700" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-blue-500" />
                          <span>
                            {campaign.contacts_engaged > 0
                              ? ((campaign.contacts_engaged / campaign.contacts_reached) * 100).toFixed(0)
                              : 0}% {t('crm.dashboard.engaged')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-purple-500" />
                          <span>
                            {campaign.contacts_converted > 0
                              ? ((campaign.contacts_converted / campaign.contacts_reached) * 100).toFixed(0)
                              : 0}% {t('crm.dashboard.converted')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {data.activeCampaigns.length === 0 && (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                    <Send className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{t('crm.dashboard.noActiveCampaigns')}</p>
                  <Button
                    variant="link"
                    className="mt-1 text-orange-600"
                    onClick={() => navigate('/dashboard/crm/campaigns/new')}
                  >
                    {t('crm.campaigns.addCampaign')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Card
              key={action.title}
              className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-5">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${action.gradient} flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold dark:text-white mb-1">{action.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
