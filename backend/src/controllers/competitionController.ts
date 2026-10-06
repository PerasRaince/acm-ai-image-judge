import { Request, Response, NextFunction } from 'express';
import { competitionService } from '../services/competitionService';
import { createCompetitionSchema, updateCompetitionSchema } from '../validators/competitionValidator';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export async function listCompetitions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const organizerId = req.query.organizer_id as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await competitionService.listCompetitions({
      status,
      organizerId,
      userId: req.user?.id,
      page,
      limit
    });

    res.json({
      success: true,
      data: result.competitions,
      pagination: {
        page,
        limit,
        total: result.total
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCompetition(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const competition = await competitionService.getCompetitionById(id, req.user?.id);

    res.json({
      success: true,
      data: competition
    });
  } catch (err) {
    next(err);
  }
}

export async function createCompetition(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!req.file) {
      throw new BadRequestError('Reference image file is required.');
    }

    const validatedInput = createCompetitionSchema.parse(req.body);

    const competition = await competitionService.createCompetition(
      req.user.id,
      validatedInput,
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype
      }
    );

    res.status(201).json({
      success: true,
      data: competition
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCompetition(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { id } = req.params;
    const validatedInput = updateCompetitionSchema.parse(req.body);

    const competition = await competitionService.updateCompetition(
      id,
      req.user.id,
      validatedInput,
      req.user.role === 'admin'
    );

    res.json({
      success: true,
      data: competition
    });
  } catch (err) {
    next(err);
  }
}

export async function joinCompetition(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { id } = req.params;
    const participant = await competitionService.joinCompetition(id, req.user.id);

    res.status(201).json({
      success: true,
      data: participant
    });
  } catch (err) {
    next(err);
  }
}
