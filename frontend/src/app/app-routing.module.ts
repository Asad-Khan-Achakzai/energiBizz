import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomConfigComponent } from './shared/components/room-config/room-config.component';
import { VideoRoomComponent } from './video-room/video-room.component';
import { DemoComponent } from './demo/demo.component';
import { HomeComponent } from './home/home.component';
//import { ParticipantsComponent } from './shared/components/participants/participants.component';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  //{ path: 'part', component: ParticipantsComponent },
  { path: 'tool', component: ToolbarComponent },
  { path: 'demo', component: DemoComponent },
	{ path: 'energibizz-trillo-1221', component: RoomConfigComponent },
	{ path: ':roomName', component: VideoRoomComponent }
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true })],
	exports: [RouterModule]
})
export class AppRoutingModule {}

