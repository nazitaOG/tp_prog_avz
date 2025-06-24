import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { CloudinaryProvider } from './providers/claudinary.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [FilesService, CloudinaryProvider],
  exports: [FilesService],
})
export class FilesModule {}
