import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put()
  bulkUpdate(@Body() body: Record<string, string>) {
    return this.settingsService.bulkUpdate(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':key')
  set(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.set(key, value);
  }
}
