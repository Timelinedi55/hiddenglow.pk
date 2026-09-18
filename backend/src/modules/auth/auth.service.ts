import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private adminRepo: Repository<AdminUser>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.adminRepo.findOne({ where: { email, isActive: true } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: admin.id, email: admin.email };
    return {
      accessToken: this.jwtService.sign(payload),
      admin: { id: admin.id, name: admin.name, email: admin.email },
    };
  }

  async validateAdmin(id: number) {
    return this.adminRepo.findOne({ where: { id, isActive: true } });
  }

  async changePassword(adminId: number, currentPassword: string, newPassword: string) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin not found');

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    admin.password = await bcrypt.hash(newPassword, 10);
    await this.adminRepo.save(admin);
    return { message: 'Password updated successfully' };
  }
}
