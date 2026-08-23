export class CreateCinemaRequestUseCase {
  constructor({ cinemaGateway }) {
    this.cinemaGateway = cinemaGateway;
  }

  execute(request) {
    return this.cinemaGateway.createCinemaRequest(request);
  }
}
