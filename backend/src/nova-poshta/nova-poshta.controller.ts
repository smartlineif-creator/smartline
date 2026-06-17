import { Controller, Get, Query } from '@nestjs/common';
import { NovaPoshtaService } from './nova-poshta.service';

@Controller('nova-poshta')
export class NovaPoshtaController {
  constructor(private novaPoshtaService: NovaPoshtaService) {}

  @Get('cities')
  searchCities(@Query('query') query: string) {
    return this.novaPoshtaService.searchCities(query || '');
  }

  @Get('warehouses')
  getWarehouses(@Query('cityRef') cityRef: string) {
    return this.novaPoshtaService.getWarehouses(cityRef);
  }

  @Get('streets')
  searchStreets(@Query('cityRef') cityRef: string, @Query('query') query: string) {
    return this.novaPoshtaService.searchStreets(cityRef, query || '');
  }
}
