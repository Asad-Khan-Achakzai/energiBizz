import {Component, OnInit} from '@angular/core';
import {FormBuilder, Validators, FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {uniqueNamesGenerator, adjectives, colors, animals} from 'unique-names-generator';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit
{
  public roomForm: FormControl;
  public version = require('../../../package.json').version;

  constructor(private router: Router, public formBuilder: FormBuilder)
  {

  }

  ngOnInit()
  {
    console.log("ngOnInit: Home Component");
    const randomName = uniqueNamesGenerator({dictionaries: [adjectives, colors, animals], separator: '-',});
    this.roomForm = new FormControl(randomName, [Validators.minLength(4), Validators.required]);
  }

  public DemoApplication()
  {
      console.log("DemoApplication: Start Demo");
      this.router.navigate(['/demo']);
  }

  public goToVideoCall()
  {
    if (this.roomForm.valid)
    {
      const roomName = this.roomForm.value.replace(/ /g, '-'); // replace white spaces by -
      this.roomForm.setValue(roomName);
      console.log("goToVideoCall: Move to Room {%s}", roomName);
      this.router.navigate(['/', roomName]);
    }
  }
}
