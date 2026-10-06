import { Request, Response, NextFunction } from 'express';
import { submissionService } from '../services/submissionService';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export async function submitRecreation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { id: competitionId } = req.params;

    if (!req.file) {
      throw new BadRequestError('Submission image recreation file is required.');
    }

    const result = await submissionService.createSubmission({
      competitionId,
      participantId: req.user.id,
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype
    });

    res.status(201).json({
      success: true,
      data: {
        submission: result.submission,
        score: result.score
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const submission = await submissionService.getSubmissionById(id, req.user?.id, req.user?.role);

    res.json({
      success: true,
      data: submission
    });
  } catch (err) {
    next(err);
  }
}

export async function listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const competitionId = req.query.competition_id as string | undefined;
    const participantId = req.query.participant_id as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await submissionService.listSubmissions({
      competitionId,
      participantId,
      page,
      limit
    });

    res.json({
      success: true,
      data: result.submissions,
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
