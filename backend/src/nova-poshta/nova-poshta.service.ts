import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

@Injectable()
export class NovaPoshtaService {
  private readonly logger = new Logger(NovaPoshtaService.name);
  private apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('NOVA_POSHTA_KEY') || '';
  }

  async searchCities(query: string) {
    try {
      const response = await axios.post(NP_API_URL, {
        apiKey: this.apiKey,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: { CityName: query, Limit: 20 },
      });

      if (!response.data?.success) {
        this.logger.warn(`Nova Poshta searchCities failed: ${JSON.stringify(response.data?.errors)}`);
        return [];
      }

      return response.data.data?.[0]?.Addresses || [];
    } catch (err: any) {
      this.logger.error(`Nova Poshta searchCities error: ${err?.message}`);
      return [];
    }
  }

  async getWarehouses(cityRef: string) {
    try {
      const response = await axios.post(NP_API_URL, {
        apiKey: this.apiKey,
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: { CityRef: cityRef, Limit: 200 },
      });

      if (!response.data?.success) {
        this.logger.warn(`Nova Poshta getWarehouses failed: ${JSON.stringify(response.data?.errors)}`);
        return [];
      }

      return response.data.data || [];
    } catch (err: any) {
      this.logger.error(`Nova Poshta getWarehouses error: ${err?.message}`);
      return [];
    }
  }

  async searchStreets(cityRef: string, query: string) {
    if (!cityRef || query.trim().length < 2) return [];

    try {
      const response = await axios.post(NP_API_URL, {
        apiKey: this.apiKey,
        modelName: 'AddressGeneral',
        calledMethod: 'getStreet',
        methodProperties: {
          CityRef: cityRef,
          FindByString: query,
          Limit: 50,
        },
      });

      if (!response.data?.success) {
        this.logger.warn(`Nova Poshta searchStreets failed: ${JSON.stringify(response.data?.errors)}`);
        return [];
      }

      return response.data.data || [];
    } catch (err: any) {
      this.logger.error(`Nova Poshta searchStreets error: ${err?.message}`);
      return [];
    }
  }
}
