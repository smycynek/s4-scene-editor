describe("Colors", function() {
  var player;
  var song;

  beforeEach(function() {
    
  });

  it("should be able to create a color via rgb (white)", function() {
    var colorTriple = new colorByTriple(255,255,255);
    expect(colorTriple.color).toBe(0xffffff);
  });

  it("should be able to create a color via rgb (red)", function() {
    var colorTriple = new colorByTriple(255,0,0);
    expect(colorTriple.color).toBe(0xff0000);
  });

  it("should be able to create a color via rgb (green)", function() {
    var colorTriple = new colorByTriple(0,255,0);
    expect(colorTriple.color).toBe(0x00ff00);
  });

  it("should be able to create a color via rgb (yellow)", function() {
    var colorTriple = new colorByTriple(255,255,0);
    expect(colorTriple.color).toBe(0xffff00);
  });


  it("should be able to create a color via rgb (blue)", function() {
    var colorTriple = new colorByTriple(0,0,255);
    expect(colorTriple.color).toBe(0x0000ff);
  });

  it("should be able to create a color via rgb (reddish)", function() {
    var colorTriple = new colorByTriple(128,16,8);
    expect(colorTriple.color).toBe(0x801008);
  });


  it("should be able to create a color via hex string (white)", function() {
    var colorhex = new color("0xffffff");
    expect(colorhex.color).toBe(0xffffff);
  });

  it("should be able to create a color via hex string  (red)", function() {
    var colorhex = new color("0xff0000");
    expect(colorhex.color).toBe(0xff0000);
  });

  it("should be able to create a color via hex string  (green)", function() {
    var colorhex = new color("0x00ff00");
    expect(colorhex.color).toBe(0x00ff00);
  });

    it("should be able to create a color via hex string (yellow)", function() {
    var colorhex = new color("0xffff00");
    expect(colorhex.color).toBe(0xffff00);
  });

  it("should be able to create a color via hex string  (blue)", function() {
    var colorhex = new color("0x0000ff");
    expect(colorhex.color).toBe(0x0000ff);
  });

  it("should be able to create a color via hex string  (reddish)", function() {
    var colorhex = new color("0x801008");
    expect(colorhex.color).toBe(0x801008);
  });

  it("should be able to scale a color-grey by 50%", function () {
    var colorTriple = new colorByTriple(128,128,128);
    var scaledColor = scaleColor(colorTriple, 0.5);
    expect(scaledColor.color).toBe(0x404040);
  });

  it("should be able to scale a color-red by 50%", function () {
    var colorTriple = new colorByTriple(255,0,0);
    var scaledColor = scaleColor(colorTriple, 0.5);
    expect(scaledColor.color).toBe(0x7f0000); //account for base-ten floating point error
  });


});
 