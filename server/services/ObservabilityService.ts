import { MetricsRepository } from '../repositories';

export class ObservabilityService {
  private metricsRepo = new MetricsRepository();

  async logResponseTime(path: string, durationMs: number) {
    await this.metricsRepo.logMetric('ResponseTime', durationMs, { path });
  }

  async logJobFailure(jobName: string, error: string) {
    await this.metricsRepo.logMetric('JobFailure', 1, { jobName, error });
  }

  async getSystemHealth() {
    const summary = await this.metricsRepo.getHealthSummary();
    const status = summary.some(m => m.MetricType === 'JobFailure' && m.Count > 5) ? 'Degraded' : 'Healthy';
    
    return {
      status,
      metrics: summary,
      timestamp: new Date()
    };
  }
}
