import { Request, Response, NextFunction } from 'express';
import { EventRepository } from '../../repositories';

export class FinancialEventController {
  private eventRepo = new EventRepository(); // Still using legacy repo for now, but pattern is established

  getDeadLetter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.eventRepo.getDeadLetterEvents();
      res.json(events);
    } catch (err) {
      next(err);
    }
  };

  retry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.body;
      if (!eventId) throw new Error('EventId is required');
      await this.eventRepo.retryEvent(eventId);
      res.json({ message: `Event ${eventId} queued for retry` });
    } catch (err) {
      next(err);
    }
  };
}
