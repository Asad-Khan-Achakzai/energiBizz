import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../services/chat/chat.service';
import { TokenService } from '../../services/token/token.service';

@Component({
  selector: 'app-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.css']
})
export class ParticipantsComponent implements OnInit {
  participantlist;
  constructor(		public tokenService: TokenService , private chatService : ChatService) { }

  ngOnInit(): void {
    this.participantlist = this.tokenService.aParticipantsList;
  }

  close() {
		this.chatService.toggleParticipants();
	}
}
