import { Module } from '@nestjs/common';
import { NovaPoshtaController } from './nova-poshta.controller';
import { NovaPoshtaService } from './nova-poshta.service';

@Module({
  controllers: [NovaPoshtaController],
  providers: [NovaPoshtaService],
})
export class NovaPoshtaModule {}
